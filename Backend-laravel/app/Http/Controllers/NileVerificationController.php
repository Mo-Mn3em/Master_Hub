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
     * Get patient personal summary using Nile API /nile/personal-summary endpoint.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function personalSummary(Request $request): JsonResponse
    {
        $patientId = $request->input('patientID')
            ?? $request->input('patientId')
            ?? $request->input('patient_id')
            ?? $request->input('identificationNumber')
            ?? $request->input('IdentificationNumber')
            ?? $request->input('identification_number')
            ?? $request->input('mrn')
            ?? $request->input('id')
            ?? $request->input('mobile')
            ?? '';

        $patientId = trim((string)$patientId);

        if ($patientId === '') {
            return response()->json([
                'status'  => 'error',
                'message' => 'patientID is required.',
            ], 422);
        }

        try {
            $result = $this->nileService->getPersonalSummary($patientId);

            if (!$result['success']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message'],
                    'details' => $result['data'] ?? null,
                ], $result['status'] >= 400 && $result['status'] < 600 ? $result['status'] : 404);
            }

            return response()->json([
                'status' => 'success',
                'data'   => $result['data'],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify / lookup patient (kept for backwards compatibility).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verify(Request $request): JsonResponse
    {
        return $this->personalSummary($request);
    }

    /**
     * Get patient visits using Nile API /nile/patient-visits endpoint.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function patientVisits(Request $request): JsonResponse
    {
        $patientId = $request->input('patientID')
            ?? $request->input('patientId')
            ?? $request->input('patient_id')
            ?? $request->input('identificationNumber')
            ?? $request->input('IdentificationNumber')
            ?? $request->input('mrn')
            ?? $request->input('id')
            ?? '';

        $patientId = trim((string)$patientId);

        if ($patientId === '') {
            return response()->json([
                'status'  => 'error',
                'message' => 'patientID is required.',
            ], 422);
        }

        try {
            $result = $this->nileService->getPatientVisits($patientId);

            if (!$result['success']) {
                return response()->json($result['data'] ?? [
                    'visits' => [],
                    'error'  => $result['message'],
                ], $result['status'] >= 400 && $result['status'] < 600 ? $result['status'] : 500);
            }

            $visitsData = $result['data'];
            $visits = $visitsData['visits'] ?? [];

            // Automatically save/sync to database if the case exists and the column has been created
            if (\Illuminate\Support\Facades\Schema::hasColumn('cases', 'patient_visits')) {
                $case = \App\Models\Cases::where('mrn', $patientId)
                    ->orWhere('national_id', $patientId)
                    ->first();

                if ($case) {
                    $case->update(['patient_visits' => $visits]);
                }
            }

            return response()->json($visitsData);
        } catch (Exception $e) {
            return response()->json([
                'visits' => [],
                'error'  => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Fetch visits from Nile API and sync/save directly into the case record in the DB.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function syncPatientVisits(Request $request): JsonResponse
    {
        $patientId = $request->input('patientID') ?? $request->input('mrn');
        $caseId = $request->input('case_id');

        if (!$patientId && !$caseId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'patientID or case_id is required.',
            ], 422);
        }

        $case = $caseId ? \App\Models\Cases::find($caseId) : \App\Models\Cases::where('mrn', $patientId)->first();
        if (!$case) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Case not found in database.',
            ], 404);
        }

        $lookupId = $patientId ?: $case->mrn;
        $result = $this->nileService->getPatientVisits($lookupId);

        if (!$result['success']) {
            return response()->json([
                'status'  => 'error',
                'message' => $result['message'],
            ], 500);
        }

        $visits = $result['data']['visits'] ?? [];

        if (\Illuminate\Support\Facades\Schema::hasColumn('cases', 'patient_visits')) {
            $case->update(['patient_visits' => $visits]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => count($visits) . ' visits retrieved and synced successfully.',
            'visits'  => $visits,
            'case'    => $case->fresh(),
        ]);
    }
}



