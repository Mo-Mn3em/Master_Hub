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

        // Clean and normalize mobile and national ID
        $cleanMobile = trim(str_replace([' ', '-', '(', ')'], '', $mobile));
        if (str_starts_with($cleanMobile, '+20')) {
            $cleanMobile = '0' . substr($cleanMobile, 3);
        } elseif (str_starts_with($cleanMobile, '20') && strlen($cleanMobile) === 12) {
            $cleanMobile = substr($cleanMobile, 1);
        }
        $cleanId = trim(str_replace([' ', '-'], '', $identificationNumber));

        // Try both 'SSN' and 'NationalID' in case the hospital HIS registered under either type
        $typesToTry = ['SSN', 'NationalID'];
        $lastResult = null;

        foreach ($typesToTry as $typeId) {
            $payload = [
                'Patient' => [
                    'mobile'               => $cleanMobile,
                    'TypeOfIdentification' => $typeId,
                    'IdentificationNumber' => $cleanId,
                ]
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
                    $status = $json['data']['status'] ?? $json['status'] ?? '';
                    $pData = $json['data']['patientdata'] ?? $json['data']['patientData'] ?? null;

                    // If verified and contains valid patient data, return immediately
                    if ($status === 'Verified' || ($pData && (!empty($pData['patientID']) || !empty($pData['firstNameAr'])))) {
                        return [
                            'success' => true,
                            'status'  => $response->status(),
                            'data'    => $json,
                        ];
                    }

                    $lastResult = [
                        'success' => true,
                        'status'  => $response->status(),
                        'data'    => $json,
                    ];
                }
            } catch (Exception $e) {
                Log::error('Nile API Exception for type ' . $typeId, [
                    'url'     => $url,
                    'payload' => $payload,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        return $lastResult ?? [
            'success' => false,
            'message' => 'Patient NOT found in Nile Alamal database.',
            'status'  => 404,
            'data'    => null,
        ];
    }
    }
}
