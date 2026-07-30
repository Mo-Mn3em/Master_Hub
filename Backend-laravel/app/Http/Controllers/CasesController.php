<?php
namespace App\Http\Controllers;

use App\Models\CASES;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CasesController extends Controller
{

    // func to return all the cases w all the data of it.
    public function index(Request $request){
        $query = CASES::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('mrn', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->paginate(20));

    }
    
    //func to return the cases w the filters.
    public function filter(Request $request){
        $query = CASES::query();

        // Text search (same as index)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('mrn', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%");
            });
        }

        // Exact column filters (e.g., status)
        $filterable = ['status'];
        foreach ($filterable as $col) {
            if ($request->filled($col)) {
                $query->where($col, $request->input($col));
            }
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Generic whitelist for future columns
        $allowed = ['full_name', 'mrn', 'national_id', 'status'];
        foreach ($request->query() as $key => $value) {
            if (!in_array($key, $allowed) && $request->filled($key)) {
                $query->where($key, $value);
            }
        }

        return response()->json($query->latest()->paginate(20));
    }

    
    //func to validate the data and store it in the DB.
    public function store(Request $request){
        $validated = $this->validateData($request);
        $case = CASES::create($validated);
        return response()->json($case, 201);
    }

    /**
     * Bulk-create multiple cases in a single request.
     * Accepts both direct array payloads [ {case1}, {case2} ]
     * and wrapped object payloads { "cases": [ {case1}, {case2} ] }.
     */
    public function bulkStore(Request $request)
    {
        // 1. Extract items if payload is a direct JSON array [ {...} ] or wrapped { "cases": [...] }
        $payload = $request->json()->all();
        
        if (array_is_list($payload)) {
            $items = $payload;
        } elseif ($request->has('cases') && is_array($request->input('cases'))) {
            $items = $request->input('cases');
        } else {
            return response()->json([
                'message' => 'The request body must be a JSON array [ {...} ] or contain a "cases" array.',
                'errors'  => [
                    'cases' => ['The payload must be an array of cases or an object with a "cases" key.']
                ]
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

        // 2. Validate every item individually
        foreach ($items as $index => $itemData) {
            if (!is_array($itemData)) {
                $errors[$index] = ['item' => ['Invalid case object structure.']];
                continue;
            }
            $itemRequest = new Request($itemData);
            try {
                $validatedItems[] = $this->validateData($itemRequest);
            } catch (\Illuminate\Validation\ValidationException $e) {
                $errors[$index] = $e->errors();
            }
        }

        // 3. If any item failed validation, return all errors without saving anything
        if (!empty($errors)) {
            return response()->json([
                'message' => 'Validation failed for one or more cases.',
                'errors'  => $errors,
            ], 422);
        }

        // 4. Insert everything inside a transaction
        $created = DB::transaction(function () use ($validatedItems) {
            $results = [];
            foreach ($validatedItems as $data) {
                $results[] = CASES::create($data);
            }
            return $results;
        });

        return response()->json([
            'message' => count($created) . ' cases created successfully.',
            'data'    => $created,
        ], 201);
    }

    //func to return a specific case w all the data of it.
    public function show(CASES $case){
        return response()->json($case);
    }

    //func to update a specific case w all the data of it.
    public function update(Request $request, CASES $case){
        $validated = $this->validateData($request, $case->id);
        $case->update($validated);
        return response()->json($case);
    }

    //func to delete a specific case w all the data of it.
    public function destroy(CASES $case){
        $case->delete();
        return response()->json(['message' => 'Case deleted successfully']);
    }

    //func to validate the data of the case.
    protected function validateData(Request $request, $caseId = null): array{
        $validator = Validator::make($request->all(), [
            // Core demographics
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

            // Motor / Mobility
            'motor_problem'           => 'nullable|string',
            'motor_problem_detail'    => 'nullable|string',

            // Dates
            'date_of_joining_request' => 'nullable|date',

            // Free-text referral reason (was a rigid enum before)
            'cause_of_acceptance'     => 'nullable|string',

            // Medical & social notes
            'general_medical_history' => 'nullable|string',
            'social_notes'            => 'nullable|string',

            // Social followup alarm
            'bas_soc_alarm_active'    => 'nullable|boolean',
            'bas_soc_alarm_date'      => 'nullable|date',
            'bas_soc_alarm_note'      => 'nullable|string',
            'bas_soc_alarm_priority'  => 'nullable|in:red,yellow,blue',

            // Department clinic enrollments & department data
            'programs'                => 'nullable|array',

            // Research study data
            'research'                => 'nullable|array',
        ]);

        return $validator->validate();
    }

}