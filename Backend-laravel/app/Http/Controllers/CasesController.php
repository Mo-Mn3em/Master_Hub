<?php
namespace App\Http\Controllers;

use App\Models\CASES;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CasesController extends Controller
{
    protected array $governments = [
        'cairo', 'giza', 'alexandria', 'qalyubia', 'port_said', 'suez',
        'dakahlia', 'sharqia', 'gharbia', 'monufia', 'beheira', 'kafr_el_sheikh',
        'damietta', 'ismailia', 'fayoum', 'beni_suef', 'minya', 'assiut',
        'sohag', 'qena', 'luxor', 'aswan', 'red_sea', 'new_valley',
        'matrouh', 'north_sinai', 'south_sinai', 'outside_egypt',
    ];

    protected array $bloodGroups = [
     'A+',
     'A-',
     'B+', 
     'B-', 
     'AB+', 
     'AB-', 
     'O+',
      'O-'
      
      ];


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
            'mrn' => 'required|string|unique:cases,mrn,' . $caseId,
            'full_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'national_id' => 'required|digits:14|unique:cases,national_id,' . $caseId,
            'phone_number' => 'required|digits:11',
            'government' => 'required|in:' . implode(',', $this->governments),
            'outside_egypt_details' => 'nullable|required_if:government,outside_egypt|string',
            'blood_group' => 'required|in:' . implode(',', $this->bloodGroups),
            'motor_problem' => 'required|in:can_move,cannot_move',
            'date_of_joining_request' => 'required|date',
            'cause_of_acceptance' => 'required|in:accepted,not_accepted',
            'general_medical_history' => 'nullable|string',
        ]);

        return $validator->validate();
    }

}