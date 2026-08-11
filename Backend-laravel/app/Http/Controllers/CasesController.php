<?php

namespace App\Http\Controllers;

use App\Models\Cases;
use App\Models\Department;
use App\Models\Dept;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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
        return response()->json($query->paginate(20));
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
            $query->whereHas('departments', function ($q) use ($deptCode) {
                $q->where('code', $deptCode);
            });
        }

        $query = $this->applySorting($query, $request);
        return response()->json($query->paginate(20));
    }

    protected function applySorting($query, Request $request)
    {
        $sortBy = $request->input('sort_by', 'surgery_asc');

        if ($sortBy === 'age_asc') {
            return $query->orderBy('cases.date_of_birth', 'desc')->orderBy('cases.created_at', 'desc');
        } elseif ($sortBy === 'age_desc') {
            return $query->orderBy('cases.date_of_birth', 'asc')->orderBy('cases.created_at', 'desc');
        } elseif ($sortBy === 'surgery_desc') {
            return $query->leftJoin('dept_surgical_list', 'cases.id', '=', 'dept_surgical_list.case_id')
                         ->select('cases.*')
                         ->orderBy('dept_surgical_list.scheduled_date', 'desc')
                         ->orderBy('cases.created_at', 'desc');
        } else { // 'surgery_asc' (Default: closest surgery date to farthest, fallback by age)
            return $query->leftJoin('dept_surgical_list', 'cases.id', '=', 'dept_surgical_list.case_id')
                         ->select('cases.*')
                         ->orderByRaw('CASE WHEN dept_surgical_list.scheduled_date IS NULL THEN 1 ELSE 0 END ASC')
                         ->orderBy('dept_surgical_list.scheduled_date', 'asc')
                         ->orderBy('cases.date_of_birth', 'desc')
                         ->orderBy('cases.created_at', 'desc');
        }
    }

    // func to store case in DB and sync dedicated department tables.
    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        $case = DB::transaction(function () use ($validated, $request) {
            $createdCase = Cases::create($validated);
            $this->syncDepartments($createdCase, $request);
            return $createdCase;
        });

        $case->load(self::$deptRelations);
        return response()->json($case, 201);
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

        $created = DB::transaction(function () use ($validatedItems, $itemRequests) {
            $results = [];
            foreach ($validatedItems as $index => $data) {
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
        return response()->json($case);
    }

    // func to update a specific case.
    public function update(Request $request, Cases $case)
    {
        $validated = $this->validateData($request, $case->id);

        DB::transaction(function () use ($case, $validated, $request) {
            $case->update($validated);
            $this->syncDepartments($case, $request);
        });

        $case->load(self::$deptRelations);
        return response()->json($case);
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
        $validator = Validator::make($request->all(), [
            'mrn'                     => 'required|string|unique:cases,mrn,' . $caseId,
            'full_name'               => 'required|string|max:255',
            'gender'                  => 'required|in:male,female',
            'national_id'             => 'nullable|string|max:14|unique:cases,national_id,' . $caseId,
            'date_of_birth'           => 'nullable|date',
            'age'                     => 'nullable|string',
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
        ]);

        $data = $validator->validate();
        if (isset($data['programs']) && is_array($data['programs'])) {
            $data['programs'] = implode("\n", array_filter($data['programs']));
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
                $modelClass::updateOrCreate(
                    ['case_id' => $case->id],
                    $data
                );

                $enrolledDeptIds[] = $deptMaster->id;
            }
        }

        // 2. Check legacy clinic_* fields
        foreach ($this->deptCodeToMap as $code => $mapInfo) {
            $colName = $mapInfo['col'];
            $deptMaster = $allDepts->get($code);
            if ($request->has($colName) && $deptMaster) {
                $data = $request->input($colName);
                if (is_array($data) && !empty($data)) {
                    $modelClass = $mapInfo['model'];
                    $modelClass::updateOrCreate(
                        ['case_id' => $case->id],
                        $data
                    );
                    $enrolledDeptIds[] = $deptMaster->id;
                }
            }
        }

        // 3. Enforce Workflow Rule: Surgery Decision / Booking Request Auto-enrolls Anesthesia Clinic
        $anesMaster = $allDepts->get('anes');
        if ($anesMaster) {
            $hasSurgeryRequested = false;
            $surgeryOps = [];

            // Check all dedicated department models for case
            foreach ($this->deptCodeToMap as $code => $mapInfo) {
                if ($code === 'anes' || $code === 'surg') continue;
                $modelClass = $mapInfo['model'];
                $deptRecord = $modelClass::where('case_id', $case->id)->first();
                if ($deptRecord) {
                    $opDecided = strtolower((string)($deptRecord->op_decided ?? ''));
                    $bookingActive = !empty($deptRecord->surgery_booking_active);
                    $plannedOp = trim((string)($deptRecord->planned_operation ?? ''));

                    if ($opDecided === 'yes' || $bookingActive || !empty($plannedOp)) {
                        $hasSurgeryRequested = true;
                        if (!empty($plannedOp)) {
                            $surgeryOps[] = $plannedOp;
                        }
                    }
                }
            }

            if ($hasSurgeryRequested) {
                $enrolledDeptIds[] = $anesMaster->id;
                $requestedOpName = implode(' + ', array_unique($surgeryOps));

                Dept\DeptAnesthesia::updateOrCreate(
                    ['case_id' => $case->id],
                    [
                        'status' => 'enrolled',
                        'requested_operation' => $requestedOpName ?: null,
                    ]
                );
            }
        }

        // 4. Sync pure pivot case_department junction table and update programs multiline string
        $uniqueEnrolledIds = array_unique($enrolledDeptIds);
        if (!empty($uniqueEnrolledIds)) {
            $case->departments()->sync($uniqueEnrolledIds);

            // Re-build programs multiline linked list from enrolled department names
            $enrolledNames = Department::whereIn('id', $uniqueEnrolledIds)->pluck('name')->toArray();
            $case->update(['programs' => implode("\n", $enrolledNames)]);
        }
    }
}