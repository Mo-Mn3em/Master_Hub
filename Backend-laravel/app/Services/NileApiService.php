<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class NileApiService
{
    protected string $baseUrl;
    protected string $username;
    protected string $password;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.nile.base_url', 'http://10.2.2.41/KsiApi'), '/');
        $this->username = config('services.nile.username', '');
        $this->password = config('services.nile.password', '');
    }

    /**
     * Fetch access token from /token endpoint.
     * Caches token for 55 minutes unless forced.
     */
    public function getToken(bool $forceRefresh = false): string
    {
        if ($forceRefresh) {
            Cache::forget('nile_access_token');
        }

        return Cache::remember('nile_access_token', now()->addMinutes(55), function () {
            $url = $this->baseUrl . '/token';

            $response = Http::asForm()->post($url, [
                'grant_type' => 'password',
                'username'   => $this->username,
                'password'   => $this->password,
            ]);

            if ($response->failed()) {
                Log::error('Nile API token request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                throw new Exception('Failed to obtain token from Nile API: ' . $response->body());
            }

            $data = $response->json();
            $token = $data['access_token'] ?? $data['token'] ?? $data['Token'] ?? null;

            if (!$token) {
                // Handle case where body is plain text token or string token
                $token = trim($response->body(), '"');
            }

            if (empty($token)) {
                throw new Exception('No access token returned from Nile API');
            }

            return $token;
        });
    }

    /**
     * Verify patient details with Nile API.
     *
     * @param string $mobile
     * @param string $typeOfIdentification (e.g. SSN, NationalID)
     * @param string $identificationNumber
     * @return array
     */
    public function verifyPatient(string $mobile, string $typeOfIdentification, string $identificationNumber): array
    {
        $url = $this->baseUrl . '/nile/verify-patient';

        // Nile Alamal API requires 'NationalID' for national ID lookups
        if (empty($typeOfIdentification) || strtoupper($typeOfIdentification) === 'SSN') {
            $typeOfIdentification = 'NationalID';
        }

        // Exact JSON payload matching Swagger UI specification
        $payload = [
            'mobile'               => $mobile,
            'typeOfIdentification' => $typeOfIdentification,
            'identificationNumber' => $identificationNumber,
        ];

        // Attempt request with Token if credentials exist, otherwise direct JSON POST
        try {
            $req = Http::acceptJson()->asJson()->timeout(15);

            if (!empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken();
                    if ($token) {
                        $req = $req->withToken($token);
                    }
                } catch (Exception $e) {
                    Log::warning('Nile API token retrieval skipped or failed: ' . $e->getMessage());
                }
            }

            $response = $req->post($url, $payload);

            // If 401 Unauthorized and credentials are provided, attempt token refresh once
            if ($response->status() === 401 && !empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken(true);
                    $response = Http::withToken($token)->acceptJson()->asJson()->timeout(15)->post($url, $payload);
                } catch (Exception $e) {
                    Log::warning('Nile API token retry failed: ' . $e->getMessage());
                }
            }

            if ($response->failed()) {
                Log::error('Nile Patient Verification failed', [
                    'url'     => $url,
                    'status'  => $response->status(),
                    'payload' => $payload,
                    'body'    => $response->body(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Nile API verification returned error status ' . $response->status(),
                    'status'  => $response->status(),
                    'data'    => $response->json() ?? $response->body(),
                ];
            }

            return [
                'success' => true,
                'status'  => $response->status(),
                'data'    => $response->json() ?? $response->body(),
            ];
        } catch (Exception $e) {
            Log::error('Nile API Exception', [
                'url'     => $url,
                'payload' => $payload,
                'error'   => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Network error connecting to Nile API: ' . $e->getMessage(),
                'status'  => 500,
                'data'    => null,
            ];
        }
    }
}
