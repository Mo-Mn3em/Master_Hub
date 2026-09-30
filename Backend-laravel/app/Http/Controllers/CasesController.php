<?php

namespace App\Http\Controllers;

use App\Models\Cases;
use App\Models\Department;
use App\Models\Dept;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;

class CasesController extends Controller
{
    public static array $deptRelations = [
        'deptAnesthesia', 'deptSpinalSurgery', 'deptHopbe', 'deptCardiac',
        'deptColorectal', 'deptOrthopedic', 'deptNeurosurgery', 'deptUrology',
        'deptEnt', 'deptGeneralSurgery', 'deptMaxillofacial', 'deptReconstructive',
        'deptAbci', 'deptHopeStart', 'deptHypospadias', 'deptSpinaBifida',
        'deptNeurodevelopmental', 'deptLiverTransplant', 'deptDental', 'deptSurgicalList',
        'departments'
    ];

    protected array $deptCodeToMap = [
        'anes'  => ['relation' => 'deptAnesthesia',         'model' => Dept\DeptAnesthesia::class,         'col' => 'clinic_anesthesia'],
        'spin'  => ['relation' => 'deptSpinalSurgery',      'model' => Dept\DeptSpinalSurgery::class,      'col' => 'clinic_spinal_surgery'],
        'hopb'  => ['relation' => 'deptHopbe',              'model' => Dept\DeptHopbe::class,              'col' => 'clinic_hopbe'],
        'hi'    => ['relation' => 'deptCardiac',            'model' => Dept\DeptCardiac::class,            'col' => 'clinic_cardiac'],
        'cprp'  => ['relation' => 'deptColorectal',         'model' => Dept\DeptColorectal::class,         'col' => 'clinic_colorectal'],
        'orth'  => ['relation' => 'deptOrthopedic',         'model' => Dept\DeptOrthopedic::class,         'col' => 'clinic_orthopedic'],
        'neur'  => ['relation' => 'deptNeurosurgery',       'model' => Dept\DeptNeurosurgery::class,       'col' => 'clinic_neurosurgery'],
        'urol'  => ['relation' => 'deptUrology',            'model' => Dept\DeptUrology::class,            'col' => 'clinic_urology'],
        'ent'   => ['relation' => 'deptEnt',                'model' => Dept\DeptEnt::class,                'col' => 'clinic_ent'],
        'gps'   => ['relation' => 'deptGeneralSurgery',     'model' => Dept\DeptGeneralSurgery::class,     'col' => 'clinic_general_surgery'],
        'maxf'  => ['relation' => 'deptMaxillofacial',      'model' => Dept\DeptMaxillofacial::class,      'col' => 'clinic_maxillofacial'],
        'recon' => ['relation' => 'deptReconstructive',     'model' => Dept\DeptReconstructive::class,     'col' => 'clinic_reconstructive'],
        'abci'  => ['relation' => 'deptAbci',               'model' => Dept\DeptAbci::class,               'col' => 'clinic_abci'],
        'hope'  => ['relation' => 'deptHopeStart',          'model' => Dept\DeptHopeStart::class,          'col' => 'clinic_hope_start'],
        'hypo'  => ['relation' => 'deptHypospadias',        'model' => Dept\DeptHypospadias::class,        'col' => 'clinic_hypospadias'],
        'sbif'  => ['relation' => 'deptSpinaBifida',        'model' => Dept\DeptSpinaBifida::class,        'col' => 'clinic_spina_bifida'],
        'ndev'  => ['relation' => 'deptNeurodevelopmental', 'model' => Dept\DeptNeurodevelopmental::class, 'col' => 'clinic_neurodevelopmental'],
        'livt'  => ['relation' => 'deptLiverTransplant',    'model' => Dept\DeptLiverTransplant::class,    'col' => 'clinic_liver_transplant'],
        'dent'  => ['relation' => 'deptDental',             'model' => Dept\DeptDental::class,             'col' => 'clinic_dental'],
        'surg'  => ['relation' => 'deptSurgicalList',       'model' => Dept\DeptSurgicalList::class,       'col' => 'clinic_surgical_list'],
    ];

    // func to return all the cases w all dedicated department data.
    public function index(Request $request)
    {
        $query = Cases::with(self::$deptRelations);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cases.full_name', 'like', "%{$search}%")
                  ->orWhere('cases.mrn', 'like', "%{$search}%")
                  ->orWhere('cases.national_id', 'like', "%{$search}%");
            });
        }

        $query = $this->applySorting($query, $request);

        if ($request->has('per_page') && $request->input('per_page') !== 'all') {
            return response()->json($query->paginate((int)$request->input('per_page')));
        }

        return response()->json($query->get());
    }

    // func to return the cases w filters and sorting.
    public function filter(Request $request)
    {
        $query = Cases::with(self::$deptRelations);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cases.full_name', 'like', "%{$search}%")
                  ->orWhere('cases.mrn', 'like', "%{$search}%")
                  ->orWhere('cases.national_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where(function ($q) use ($request) {
                $q->whereDate('cases.created_at', '>=', $request->date_from)
                  ->orWhereDate('cases.date_of_joining_request', '>=', $request->date_from);
            });
        }
        if ($request->filled('date_to')) {
            $query->where(function ($q) use ($request) {
                $q->whereDate('cases.created_at', '<=', $request->date_to)
                  ->orWhereDate('cases.date_of_joining_request', '<=', $request->date_to);
            });
        }

        if ($request->filled('department_code')) {
            $deptCode = $request->input('department_code');
            $deptInfo = $this->deptCodeToMap[$deptCode] ?? null;
            $deptMaster = Department::where('code', $deptCode)->first();
            $deptName = $deptMaster ? $deptMaster->name : '';

            $query->where(function ($q) use ($deptCode, $deptInfo, $deptName) {
                $q->whereHas('departments', function ($sub) use ($deptCode) {
                    $sub->where('code', $deptCode);
                });

                if ($deptInfo && !empty($deptInfo['relation'])) {
                    $q->orWhereHas($deptInfo['relation'], function ($sub) {
                        $sub->where('status', 'enrolled');
                    });
                }

                if (!empty($deptName)) {
                    $q->orWhere('cases.programs', 'like', "%{$deptName}%");
                }
            });
        }

        $query = $this->applySorting($query, $request);

        if ($request->has('per_page') && $request->input('per_page') !== 'all') {
            return response()->json($query->paginate((int)$request->input('per_page')));
        }

        return response()->json($query->get());
    }

    protected function applySorting($query, Request $request)
    {
        $sortBy = $request->input('sort_by', 'latest');

        if ($sortBy === 'surgery_asc') {
            return $query->leftJoin('dept_surgical_list', 'cases.id', '=', 'dept_surgical_list.case_id')
                         ->select('cases.*')
                         ->orderByRaw('CASE WHEN dept_surgical_list.scheduled_date IS NULL THEN 1 ELSE 0 END ASC')
                         ->orderBy('dept_surgical_list.scheduled_date', 'asc')
                         ->orderBy('cases.created_at', 'desc')
                         ->orderBy('cases.id', 'desc');
        } elseif ($sortBy === 'surgery_desc') {
            return $query->leftJoin('dept_surgical_list', 'cases.id', '=', 'dept_surgical_list.case_id')
                         ->select('cases.*')
                         ->orderBy('dept_surgical_list.scheduled_date', 'desc')
                         ->orderBy('cases.created_at', 'desc')
                         ->orderBy('cases.id', 'desc');
        } elseif ($sortBy === 'age_asc') {
            return $query->orderBy('cases.date_of_birth', 'desc')->orderBy('cases.created_at', 'desc');
        } elseif ($sortBy === 'age_desc') {
            return $query->orderBy('cases.date_of_birth', 'asc')->orderBy('cases.created_at', 'desc');
        } elseif ($sortBy === 'oldest') {
            return $query->orderBy('cases.created_at', 'asc')->orderBy('cases.id', 'asc');
        } else { // 'latest' (Default: newest created/registered cases first)
            return $query->orderBy('cases.created_at', 'desc')->orderBy('cases.id', 'desc');
        }
    }

    // func to store case in DB and sync dedicated department tables.
    public function store(Request $request)
    {
        try {
            $validated = $this->validateData($request);

            $userName = $request->user()?->name ?: ($request->input('created_by') ?: 'Admin');
            if (empty($validated['created_by'])) {
                $validated['created_by'] = $userName;
            }
            if (empty($validated['updated_by'])) {
                $validated['updated_by'] = $userName;
            }

            if (!Schema::hasColumn('cases', 'created_by')) {
                unset($validated['created_by']);
            }
            if (!Schema::hasColumn('cases', 'updated_by')) {
                unset($validated['updated_by']);
            }

            $case = DB::transaction(function () use ($validated, $request) {
                $createdCase = Cases::create($validated);
                $this->syncDepartments($createdCase, $request);
                return $createdCase;
            });

            $case->load(self::$deptRelations);
            return response()->json($case, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed for new case.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to create case: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);
            return response()->json([
                'message' => 'Failed to create case: ' . $e->getMessage(),
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Bulk store cases
    public function bulkStore(Request $request)
    {
        $payload = $request->json()->all();

        if (array_is_list($payload)) {
            $items = $payload;
        } elseif ($request->has('cases') && is_array($request->input('cases'))) {
            $items = $request->input('cases');
        } else {
            return response()->json([
                'message' => 'The request body must be a JSON array [ {...} ] or contain a "cases" array.',
                'errors'  => ['cases' => ['The payload must be an array of cases or an object with a "cases" key.']]
            ], 422);
        }

        if (empty($items)) {
            return response()->json([
                'message' => 'The cases list cannot be empty.',
                'errors'  => ['cases' => ['At least one case object is required.']]
            ], 422);
        }

        $errors = [];
        $validatedItems = [];
        $itemRequests = [];

        foreach ($items as $index => $itemData) {
            if (!is_array($itemData)) {
                $errors[$index] = ['item' => ['Invalid case object structure.']];
                continue;
            }
            $itemRequest = new Request($itemData);
            try {
                $validatedItems[$index] = $this->validateData($itemRequest);
                $itemRequests[$index] = $itemRequest;
            } catch (\Illuminate\Validation\ValidationException $e) {
                $errors[$index] = $e->errors();
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed for one or more cases.',
                'errors'  => $errors,
            ], 422);
        }

        $created = DB::transaction(function () use ($validatedItems, $itemRequests, $request) {
            $results = [];
            foreach ($validatedItems as $index => $data) {
                if (empty($data['created_by'])) {
                    $data['created_by'] = $request->user()?->name ?: ($itemRequests[$index]->input('created_by') ?: 'Admin');
                }
                if (empty($data['updated_by'])) {
                    $data['updated_by'] = $data['created_by'];
                }
                if (!Schema::hasColumn('cases', 'created_by')) {
                    unset($data['created_by']);
                }
                if (!Schema::hasColumn('cases', 'updated_by')) {
                    unset($data['updated_by']);
                }
                $case = Cases::create($data);
                $this->syncDepartments($case, $itemRequests[$index]);
                $case->load(self::$deptRelations);
                $results[] = $case;
            }
            return $results;
        });

        return response()->json([
            'message' => count($created) . ' cases created successfully.',
            'data'    => $created,
        ], 201);
    }

    // func to return a specific case w all department tables loaded.
    public function show(Cases $case)
    {
        $case->load(self::$deptRelations);
        $case->past_surgeries = $case->research['past_surgeries'] ?? [];
        return response()->json($case);
    }

    // func to update a specific case.
    public function update(Request $request, Cases $case)
    {
        try {
            $validated = $this->validateData($request, $case->id);

            $validated['updated_by'] = $request->input('updated_by') ?: ($request->user()?->name ?: 'Admin');

            unset($validated['created_by']);
            if (!Schema::hasColumn('cases', 'updated_by')) {
                unset($validated['updated_by']);
            }

            DB::transaction(function () use ($case, $validated, $request) {
                $case->update($validated);
                $this->syncDepartments($case, $request);
            });

            $case->refresh();
            $case->load(self::$deptRelations);
            $case->past_surgeries = $case->research['past_surgeries'] ?? [];
            return response()->json($case);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed for case.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to update case ID {$case->id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);
            return response()->json([
                'message' => 'Failed to update case: ' . $e->getMessage(),
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // func to delete a case.
    public function destroy(Cases $case)
    {
        $case->delete();
        return response()->json(['message' => 'Case deleted successfully']);
    }

    // validate core demographics & department payloads
    protected function validateData(Request $request, $caseId = null): array
    {
        $numericId = null;
        if ($caseId !== null) {
            if ($caseId instanceof Cases) {
                $existingCase = $caseId;
            } else {
                $existingCase = Cases::where('id', $caseId)->orWhere('mrn', $caseId)->first();
            }

            if ($existingCase) {
                $numericId = $existingCase->id;
                $fallbackMerges = [];
                if (!$request->filled('mrn')) {
                    $fallbackMerges['mrn'] = $existingCase->mrn;
                }
                if (!$request->filled('full_name')) {
                    $fallbackMerges['full_name'] = $existingCase->full_name;
                }
                if (!$request->filled('gender')) {
                    $fallbackMerges['gender'] = $existingCase->gender ?? 'male';
                }
                if (!empty($fallbackMerges)) {
                    $request->merge($fallbackMerges);
                }
            }
        }

        // Sanitize empty strings to null for optional database columns
        $nullableFields = [
            'national_id', 'blood_group', 'date_of_birth', 
            'date_of_joining_request', 'social_alarm_date',
            'phone_number', 'government', 'outside_egypt_details',
            'cause_of_acceptance', 'general_medical_history', 'social_notes'
        ];
        $merges = [];
        foreach ($nullableFields as $field) {
            if ($request->has($field) && trim((string)$request->input($field)) === '') {
                $merges[$field] = null;
            }
        }
        if (!empty($merges)) {
            $request->merge($merges);
        }

        $ignoreId = $numericId !== null ? $numericId : 'NULL';

        $validator = Validator::make($request->all(), [
            'mrn'                     => 'required|string|unique:cases,mrn,' . $ignoreId . ',id',
            'full_name'               => 'required|string|max:255',
            'gender'                  => 'required|in:male,female',
            'national_id'             => 'nullable|string|max:14|unique:cases,national_id,' . $ignoreId . ',id',
            'date_of_birth'           => 'nullable|date',
            'age'                     => 'nullable',
            'phone_number'            => 'nullable|string|max:50',
            'government'              => 'nullable|string',
            'outside_egypt_details'   => 'nullable|string',
            'blood_group'             => 'nullable|string|max:10',
            'motor_problem'           => 'nullable|string',
            'motor_problem_detail'    => 'nullable|string',
            'date_of_joining_request' => 'nullable|date',
            'cause_of_acceptance'     => 'nullable|string',
            'general_medical_history' => 'nullable|string',
            'social_notes'            => 'nullable|string',
            'social_alarm_active'    => 'nullable|boolean',
            'social_alarm_date'      => 'nullable|date',
            'social_alarm_note'      => 'nullable|string',
            'social_alarm_priority'  => 'nullable|in:red,yellow,blue',
            'programs'                => 'nullable',
            'departments'             => 'nullable',
            'research'                => 'nullable|array',
            'past_surgeries'          => 'nullable',
            'patient_visits'          => 'nullable',
            'created_by'              => 'nullable|string|max:255',
            'updated_by'              => 'nullable|string|max:255',
        ]);

        $data = $validator->validate();
        
        // Normalize gender
        if (!empty($data['gender'])) {
            $g = strtolower((string)$data['gender']);
            $data['gender'] = ($g === 'f' || str_contains($g, 'female')) ? 'female' : 'male';
        } else {
            $data['gender'] = 'male';
        }

        // Default social alarm priority
        if (empty($data['social_alarm_priority'])) {
            $data['social_alarm_priority'] = 'red';
        }
        if (!isset($data['social_alarm_active'])) {
            $data['social_alarm_active'] = false;
        }

        if (isset($data['programs']) && is_array($data['programs'])) {
            $data['programs'] = implode("\n", array_filter($data['programs']));
        }

        if ($request->has('past_surgeries') || $request->filled('past_surgeries') || $request->exists('past_surgeries')) {
            $researchData = $data['research'] ?? [];
            if (!is_array($researchData)) $researchData = [];
            $pastSurgeriesInput = $request->input('past_surgeries');
            if (is_string($pastSurgeriesInput)) {
                try { $pastSurgeriesInput = json_decode($pastSurgeriesInput, true); } catch (\Exception $e) {}
            }
            $researchData['past_surgeries'] = is_array($pastSurgeriesInput) ? $pastSurgeriesInput : [];
            $data['research'] = $researchData;
        }
        unset($data['past_surgeries']);
        unset($data['departments']);

        if ($request->has('patient_visits')) {
            $visitsInput = $request->input('patient_visits');
            if (is_string($visitsInput)) {
                try { $visitsInput = json_decode($visitsInput, true); } catch (\Exception $e) {}
            }
            if (Schema::hasColumn('cases', 'patient_visits')) {
                $data['patient_visits'] = is_array($visitsInput) ? $visitsInput : [];
            } else {
                unset($data['patient_visits']);
            }
        } elseif (!Schema::hasColumn('cases', 'patient_visits')) {
            unset($data['patient_visits']);
        }

        if (!Schema::hasColumn('cases', 'created_by')) {
            unset($data['created_by']);
        }
        if (!Schema::hasColumn('cases', 'updated_by')) {
            unset($data['updated_by']);
        }
        return $data;
    }


    /**
     * Sync pure case_department pivot and save dedicated department table records.
     */
    protected function syncDepartments(Cases $case, Request $request)
    {
        $allDepts = Department::all()->keyBy('code');
        $enrolledDeptIds = [];
        $modelColumnsCache = [];

        // 1. Check 'departments' payload input (e.g. from frontend apiMapper)
        if ($request->has('departments')) {
            $deptsInput = $request->input('departments');
            $deptList = is_array($deptsInput) ? (array_is_list($deptsInput) ? $deptsInput : [$deptsInput]) : [];

            foreach ($deptList as $item) {
                if (!is_array($item)) continue;
                $code = $item['code'] ?? null;
                $mapInfo = $this->deptCodeToMap[$code] ?? null;
                $deptMaster = $allDepts->get($code);
                if (!$mapInfo || !$deptMaster) continue;

                $data = $item['data'] ?? $item['department_data'] ?? $item;
                if (!is_array($data)) continue;

                $modelClass = $mapInfo['model'];
                if (!isset($modelColumnsCache[$modelClass])) {
                    $modelColumnsCache[$modelClass] = \Illuminate\Support\Facades\Schema::getColumnListing((new $modelClass)->getTable());
                }
                $validCols = $modelColumnsCache[$modelClass];

                // Sanitize: only include columns that physically exist in the MySQL table
                $cleanData = array_intersect_key($data, array_flip($validCols));
                unset($cleanData['id'], $cleanData['case_id']);

                if (!empty($cleanData)) {
                    $modelClass::updateOrCreate(
                        ['case_id' => $case->id],
                        $cleanData
                    );
                }

                $isEnrolled = false;
                if (isset($item['enrolled'])) {
                    $isEnrolled = filter_var($item['enrolled'], FILTER_VALIDATE_BOOLEAN);
                } elseif (isset($data['status'])) {
                    $isEnrolled = strtolower((string)$data['status']) === 'enrolled';
                }

                if ($isEnrolled) {
                    $enrolledDeptIds[] = $deptMaster->id;
                }
            }
        } elseif ($request->hasAny(array_column($this->deptCodeToMap, 'col'))) {
            // 2. Check legacy clinic_* fields only if 'departments' is not present
            foreach ($this->deptCodeToMap as $code => $mapInfo) {
                $colName = $mapInfo['col'];
                $deptMaster = $allDepts->get($code);
                if ($request->has($colName) && $deptMaster) {
                    $data = $request->input($colName);
                    if (is_array($data) && !empty($data)) {
                        $hasEnrolledStatus = isset($data['status']) && strtolower((string)$data['status']) === 'enrolled';
                        $modelClass = $mapInfo['model'];
                        if (!isset($modelColumnsCache[$modelClass])) {
                            $modelColumnsCache[$modelClass] = \Illuminate\Support\Facades\Schema::getColumnListing((new $modelClass)->getTable());
                        }
                        $validCols = $modelColumnsCache[$modelClass];

                        $cleanData = array_intersect_key($data, array_flip($validCols));
                        unset($cleanData['id'], $cleanData['case_id']);

                        if (!empty($cleanData)) {
                            $modelClass::updateOrCreate(
                                ['case_id' => $case->id],
                                $cleanData
                            );
                        }
                        if ($hasEnrolledStatus) {
                            $enrolledDeptIds[] = $deptMaster->id;
                        }
                    }
                }
            }
        }

        // 3. Enforce Workflow Rule: Surgery Decision / Booking Request Auto-enrolls Anesthesia Clinic & Surgical List
        $anesMaster = $allDepts->get('anes');
        $surgMaster = $allDepts->get('surg');

        $hasSurgeryRequested = false;
        $surgeryOps = [];
        $surgeryDates = [];

        // Check only active/enrolled dedicated department models for case
        foreach ($this->deptCodeToMap as $code => $mapInfo) {
            if ($code === 'anes' || $code === 'surg') continue;
            $deptMaster = $allDepts->get($code);
            if (!$deptMaster || !in_array($deptMaster->id, $enrolledDeptIds)) continue;

            $modelClass = $mapInfo['model'];
            $deptRecord = $modelClass::where('case_id', $case->id)->first();
            if ($deptRecord) {
                $opDecided = strtolower((string)($deptRecord->op_decided ?? ''));
                $bookingActive = !empty($deptRecord->surgery_booking_active);
                $plannedOp = trim((string)($deptRecord->planned_operation ?? ''));
                $bookingDate = trim((string)($deptRecord->surgery_booking_date ?? ''));

                if ($opDecided === 'yes' || $bookingActive || !empty($plannedOp)) {
                    $hasSurgeryRequested = true;
                    if (!empty($plannedOp)) {
                        $surgeryOps[] = $plannedOp;
                    }
                    if (!empty($bookingDate)) {
                        $surgeryDates[] = $bookingDate;
                    }
                }
            }
        }

        $requestedOpName = implode(' + ', array_unique($surgeryOps));
        $requestedDate = !empty($surgeryDates) ? $surgeryDates[0] : null;

        // Auto-enroll to Surgical List if Doctor chose the surgery procedure AND the date
        if ($surgMaster && !empty($requestedOpName) && !empty($requestedDate)) {
            $existingSurg = Dept\DeptSurgicalList::where('case_id', $case->id)->first();
            $isAlreadyCompleted = $existingSurg && ($existingSurg->surgical_status === 'completed' || strtolower((string)$existingSurg->status) === 'discharged');

            $surgUpdateData = [
                'status' => $isAlreadyCompleted ? 'discharged' : 'enrolled',
                'operation_name' => $requestedOpName,
                'scheduled_date' => $requestedDate,
            ];

            if ($existingSurg) {
                $existingSurg->update($surgUpdateData);
            } else {
                Dept\DeptSurgicalList::create(array_merge(['case_id' => $case->id], $surgUpdateData));
            }

            if (!$isAlreadyCompleted && !in_array($surgMaster->id, $enrolledDeptIds)) {
                $enrolledDeptIds[] = $surgMaster->id;
            } elseif ($isAlreadyCompleted) {
                $enrolledDeptIds = array_values(array_diff($enrolledDeptIds, [$surgMaster->id]));
            }
        }

        $surgRecord = Dept\DeptSurgicalList::where('case_id', $case->id)->first();
        if ($surgRecord && !empty($surgRecord->operation_name)) {
            $isCompleted = $surgRecord->surgical_status === 'completed';
            if ($isCompleted || !$hasSurgeryRequested) {
                $surgRecord->update(['status' => 'discharged']);
                if ($surgMaster) {
                    $enrolledDeptIds = array_values(array_diff($enrolledDeptIds, [$surgMaster->id]));
                }
            } else {
                $surgRecord->update(['status' => 'enrolled']);
                if ($surgMaster && !in_array($surgMaster->id, $enrolledDeptIds)) {
                    $enrolledDeptIds[] = $surgMaster->id;
                }
            }
        } elseif ($surgRecord && !$hasSurgeryRequested) {
            $surgRecord->update(['status' => 'discharged']);
            if ($surgMaster) {
                $enrolledDeptIds = array_values(array_diff($enrolledDeptIds, [$surgMaster->id]));
            }
        }

        $isCompletedStage = $surgRecord && $surgRecord->surgical_status === 'completed';
        $isOnSurgicalList = ($surgMaster && in_array($surgMaster->id, $enrolledDeptIds)) || 
                            ($surgRecord && strtolower((string)$surgRecord->status) === 'enrolled' && !$isCompletedStage && $hasSurgeryRequested);

        if ($anesMaster) {
            $existingAnes = Dept\DeptAnesthesia::where('case_id', $case->id)->first();
            if ($isCompletedStage || !$hasSurgeryRequested) {
                // If surgery completed or no active clinic requested surgery, discharge Anesthesia
                if ($existingAnes) {
                    $existingAnes->update(['status' => 'discharged']);
                }
                $enrolledDeptIds = array_values(array_diff($enrolledDeptIds, [$anesMaster->id]));
            } else if ($hasSurgeryRequested) {
                if (!in_array($anesMaster->id, $enrolledDeptIds)) {
                    $enrolledDeptIds[] = $anesMaster->id;
                }
                $finalOpName = !empty($requestedOpName) ? $requestedOpName : ($existingAnes?->requested_operation);

                $updateData = ['status' => 'enrolled'];
                if (!empty($finalOpName)) {
                    $updateData['requested_operation'] = $finalOpName;
                }

                if ($existingAnes) {
                    $existingAnes->update($updateData);
                } else {
                    Dept\DeptAnesthesia::create(array_merge(['case_id' => $case->id], $updateData));
                }
            }
        }

        // 4. Update surgical_status enum on dept_surgical_list table
        $surgLatest = Dept\DeptSurgicalList::where('case_id', $case->id)->first();
        $anesLatest = Dept\DeptAnesthesia::where('case_id', $case->id)->first();
        if ($surgLatest) {
            $computedStatus = 'waiting_anesthesia_confirm';
            $isCompleted = $surgLatest->surgical_status === 'completed' || strtolower((string)$surgLatest->status) === 'discharged';

            if ($isCompleted) {
                $computedStatus = 'completed';
            } elseif ($anesLatest && strtolower((string)$anesLatest->assessment_status) === 'unfit') {
                $computedStatus = 'unfit';
            } elseif ($anesLatest && strtolower((string)$anesLatest->assessment_status) === 'fit') {
                $consentDone = strtolower((string)($anesLatest->consent_signed ?? '')) === 'yes' || strtolower((string)($anesLatest->consent_status ?? '')) === 'signed';
                $bloodReady = strtolower((string)($anesLatest->overall_blood_ready ?? '')) === 'ready' || strtolower((string)($anesLatest->blood_status ?? '')) === 'ready';
                $cardiacClear = strtolower((string)($anesLatest->cardiac_clear ?? '')) === 'yes';

                if (!$consentDone || !$bloodReady || !$cardiacClear) {
                    $computedStatus = 'anesthesia_fit_checks_pending';
                } else {
                    $computedStatus = 'anesthesia_fit_ready';
                }
            } else {
                $computedStatus = 'waiting_anesthesia_confirm';
            }

            $surgLatest->update(['surgical_status' => $computedStatus]);
        }

        // 5. Sync pure pivot case_department junction table and update programs multiline string
        $uniqueEnrolledIds = array_unique($enrolledDeptIds);
        $case->departments()->sync($uniqueEnrolledIds);

        // Re-build programs multiline linked list from enrolled department names
        $enrolledNames = Department::whereIn('id', $uniqueEnrolledIds)->pluck('name')->toArray();
        $case->update(['programs' => implode("\n", $enrolledNames)]);
    }
}