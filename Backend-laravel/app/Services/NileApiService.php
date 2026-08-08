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
        $token = $this->getToken();
        $url = $this->baseUrl . '/nile/verify-patient';

        $payload = [
            'Patient' => [
                'mobile'               => $mobile,
                'TypeOfIdentification' => $typeOfIdentification,
                'IdentificationNumber' => $identificationNumber,
            ]
        ];

        $response = Http::withToken($token)
            ->acceptJson()
            ->post($url, $payload);

        // If 401 Unauthorized, token might be expired; retry once with fresh token
        if ($response->status() === 401) {
            $token = $this->getToken(true);
            $response = Http::withToken($token)
                ->acceptJson()
                ->post($url, $payload);
        }

        if ($response->failed()) {
            Log::error('Nile Patient Verification failed', [
                'status'  => $response->status(),
                'payload' => $payload,
                'body'    => $response->body(),
            ]);

            return [
                'success' => false,
                'message' => 'Nile API verification request failed.',
                'status'  => $response->status(),
                'data'    => $response->json() ?? $response->body(),
            ];
        }

        return [
            'success' => true,
            'status'  => $response->status(),
            'data'    => $response->json(),
        ];
    }
}
