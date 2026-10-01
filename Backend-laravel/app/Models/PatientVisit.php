<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientVisit extends Model
{
    use HasFactory;

    protected $table = 'patient_visits';

    protected $fillable = [
        'case_id',
        'mrn',
        'visit_number',
        'visit_type_ar',
        'visit_type_en',
        'visit_start_date',
        'visit_end_date',
        'place_name_ar',
        'place_name_en',
        'doctor_name_ar',
        'doctor_name_en',
        'doctor_specialty_ar',
        'doctor_specialty_en',
    ];

    public function case()
    {
        return $this->belongsTo(Cases::class, 'case_id');
    }
}
