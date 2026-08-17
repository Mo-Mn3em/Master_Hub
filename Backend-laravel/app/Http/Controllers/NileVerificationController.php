<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NileApiService;
use Illuminate\Http\JsonResponse;
use Exception;

class NileVerificationController extends Controller
{
    protected NileApiService $nileService;

    public function __construct(NileApiService $nileService)
    {
        $this->nileService = $nileService;
    }

    /**
     * Verify a patient using Nile API.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mobile'                 => 'required|string',
            'typeOfIdentification'   => 'nullable|string',
            'TypeOfIdentification'   => 'nullable|string',
            'type_of_identification' => 'nullable|string',
            'identificationNumber'   => 'nullable|string',
            'IdentificationNumber'   => 'nullable|string',
            'identification_number'   => 'nullable|string',
        ]);

        $mobile = $validated['mobile'];
        $typeOfId = $validated['typeOfIdentification'] ?? $validated['TypeOfIdentification'] ?? $validated['type_of_identification'] ?? 'NationalID';
        $idNumber = $validated['identificationNumber'] ?? $validated['IdentificationNumber'] ?? $validated['identification_number'] ?? '';

        try {
            $result = $this->nileService->verifyPatient($mobile, $typeOfId, $idNumber);

            if (!$result['success']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message'],
                    'details' => $result['data'] ?? null,
                ], $result['status'] >= 400 && $result['status'] < 600 ? $result['status'] : 500);
            }

            return response()->json([
                'status'  => 'success',
                'data'    => $result['data'],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
