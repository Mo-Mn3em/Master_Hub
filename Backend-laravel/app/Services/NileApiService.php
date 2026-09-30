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
     * Fetch patient personal summary from /nile/personal-summary endpoint.
     *
     * @param string|int $patientId
     * @return array
     */
    public function getPersonalSummary(string|int $patientId): array
    {
        $url = $this->baseUrl . '/nile/personal-summary';
        $cleanId = trim((string)$patientId);

        $payload = [
            'patientID' => $cleanId,
        ];

        try {
            $req = Http::acceptJson()->asJson()->timeout(15);

            if (!empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken();
                    if ($token) {
                        $req = $req->withToken($token);
                    }
                } catch (Exception $e) {
                    Log::warning('Nile API token retrieval failed: ' . $e->getMessage());
                }
            }

            $response = $req->post($url, $payload);

            // If 401 Unauthorized, refresh token once
            if ($response->status() === 401 && !empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken(true);
                    $response = Http::withToken($token)->acceptJson()->asJson()->timeout(15)->post($url, $payload);
                } catch (Exception $e) {
                    Log::warning('Nile API token retry failed: ' . $e->getMessage());
                }
            }

            if ($response->successful()) {
                $json = $response->json();

                // If patient record is found, PatientID, PatientNameAr, or IDNumber will be present
                if (!empty($json['PatientID']) || !empty($json['PatientNameAr']) || !empty($json['PatientNameEn']) || !empty($json['IDNumber'])) {
                    return [
                        'success' => true,
                        'status'  => $response->status(),
                        'data'    => $json,
                    ];
                }

                return [
                    'success' => false,
                    'message' => $json['error'] ?? 'Patient NOT found in Nile Alamal database.',
                    'status'  => 404,
                    'data'    => $json,
                ];
            }

            return [
                'success' => false,
                'message' => 'Nile API request failed with status ' . $response->status(),
                'status'  => $response->status(),
                'data'    => $response->json(),
            ];
        } catch (Exception $e) {
            Log::error('Nile API Personal Summary Exception', [
                'url'     => $url,
                'payload' => $payload,
                'error'   => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to connect to Nile API: ' . $e->getMessage(),
                'status'  => 500,
                'data'    => null,
            ];
        }
    }

    /**
     * Backward compatibility wrapper for patient verification / summary.
     */
    public function verifyPatient(string $mobile = '', string $typeOfIdentification = '', string $identificationNumber = ''): array
    {
        $id = !empty($identificationNumber) ? $identificationNumber : $mobile;
        return $this->getPersonalSummary($id);
    }

    /**
     * Fetch patient visits from /nile/patient-visits endpoint.
     *
     * @param string|int $patientId
     * @return array
     */
    public function getPatientVisits(string|int $patientId): array
    {
        $url = $this->baseUrl . '/nile/patient-visits';
        $cleanId = trim((string)$patientId);

        $payload = [
            'patientID' => $cleanId,
        ];

        try {
            $req = Http::acceptJson()->asJson()->timeout(15);

            if (!empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken();
                    if ($token) {
                        $req = $req->withToken($token);
                    }
                } catch (Exception $e) {
                    Log::warning('Nile API token retrieval failed: ' . $e->getMessage());
                }
            }

            $response = $req->post($url, $payload);

            // If 401 Unauthorized, refresh token once
            if ($response->status() === 401 && !empty($this->username) && !empty($this->password)) {
                try {
                    $token = $this->getToken(true);
                    $response = Http::withToken($token)->acceptJson()->asJson()->timeout(15)->post($url, $payload);
                } catch (Exception $e) {
                    Log::warning('Nile API token retry failed: ' . $e->getMessage());
                }
            }

            if ($response->successful()) {
                $json = $response->json();
                return [
                    'success' => true,
                    'status'  => $response->status(),
                    'data'    => $json,
                ];
            }

            return [
                'success' => false,
                'message' => 'Nile API patient-visits request failed with status ' . $response->status(),
                'status'  => $response->status(),
                'data'    => $response->json(),
            ];
        } catch (Exception $e) {
            Log::error('Nile API Patient Visits Exception', [
                'url'     => $url,
                'payload' => $payload,
                'error'   => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to connect to Nile API: ' . $e->getMessage(),
                'status'  => 500,
                'data'    => null,
            ];
        }
    }
}


