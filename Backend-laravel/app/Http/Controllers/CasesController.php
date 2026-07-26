<?php
namespace App\Http\Controllers;

use App\Models\CASES;
use Illuminate\Http\Request;
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

    //func to validate the data and store it in the DB.
    public function store(Request $request){
        $validated = $this->validateData($request);
        $case = CASES::create($validated);
        return response()->json($case, 201);
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