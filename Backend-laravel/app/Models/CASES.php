<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Cases extends Model
{
    use HasFactory;

    protected $table = 'cases';

    protected $fillable = [
        'mrn',
        'full_name',
        'gender',
        'national_id',
        'date_of_birth',
        'age',
        'phone_number',
        'government',
        'outside_egypt_details',
        'blood_group',
        'motor_problem',
        'motor_problem_detail',
        'date_of_joining_request',
        'cause_of_acceptance',
        'general_medical_history',
        'social_notes',
        'social_alarm_active',
        'social_alarm_date',
        'social_alarm_note',
        'social_alarm_priority',
        'programs',
        'research',
    ];

    protected $casts = [
        'date_of_birth'            => 'date',
        'date_of_joining_request'  => 'date',
        'social_alarm_active'      => 'boolean',
        'social_alarm_date'        => 'date',
        'research'                 => 'array',
    ];

    /**
     * Pure Many-to-Many relationship with Department model via case_department junction table.
     */
    public function departments()
    {
        return $this->belongsToMany(Department::class, 'case_department', 'case_id', 'department_id')->withTimestamps();
    }

    // 20 HasOne Relationships to Dedicated Department Tables
    public function deptAnesthesia()          { return $this->hasOne(Dept\DeptAnesthesia::class, 'case_id'); }
    public function deptSpinalSurgery()       { return $this->hasOne(Dept\DeptSpinalSurgery::class, 'case_id'); }
    public function deptHopbe()               { return $this->hasOne(Dept\DeptHopbe::class, 'case_id'); }
    public function deptCardiac()             { return $this->hasOne(Dept\DeptCardiac::class, 'case_id'); }
    public function deptColorectal()          { return $this->hasOne(Dept\DeptColorectal::class, 'case_id'); }
    public function deptOrthopedic()          { return $this->hasOne(Dept\DeptOrthopedic::class, 'case_id'); }
    public function deptNeurosurgery()        { return $this->hasOne(Dept\DeptNeurosurgery::class, 'case_id'); }
    public function deptUrology()             { return $this->hasOne(Dept\DeptUrology::class, 'case_id'); }
    public function deptEnt()                 { return $this->hasOne(Dept\DeptEnt::class, 'case_id'); }
    public function deptGeneralSurgery()      { return $this->hasOne(Dept\DeptGeneralSurgery::class, 'case_id'); }
    public function deptMaxillofacial()       { return $this->hasOne(Dept\DeptMaxillofacial::class, 'case_id'); }
    public function deptReconstructive()      { return $this->hasOne(Dept\DeptReconstructive::class, 'case_id'); }
    public function deptAbci()                { return $this->hasOne(Dept\DeptAbci::class, 'case_id'); }
    public function deptHopeStart()           { return $this->hasOne(Dept\DeptHopeStart::class, 'case_id'); }
    public function deptHypospadias()         { return $this->hasOne(Dept\DeptHypospadias::class, 'case_id'); }
    public function deptSpinaBifida()         { return $this->hasOne(Dept\DeptSpinaBifida::class, 'case_id'); }
    public function deptNeurodevelopmental()  { return $this->hasOne(Dept\DeptNeurodevelopmental::class, 'case_id'); }
    public function deptLiverTransplant()     { return $this->hasOne(Dept\DeptLiverTransplant::class, 'case_id'); }
    public function deptDental()              { return $this->hasOne(Dept\DeptDental::class, 'case_id'); }
    public function deptSurgicalList()        { return $this->hasOne(Dept\DeptSurgicalList::class, 'case_id'); }

    protected static function booted(): void
    {
        static::saving(function (Cases $case) {
            if ($case->national_id && strlen($case->national_id) === 14) {
                $dob = self::extractDobFromNationalId($case->national_id);
                if ($dob) {
                    $case->date_of_birth = $dob;
                    $case->age = $dob->age;
                }
            }
        });
    }

    public static function extractDobFromNationalId(string $nationalId): ?Carbon
    {
        if (strlen($nationalId) !== 14 || !ctype_digit($nationalId)) {
            return null;
        }

        $centuryDigit = (int) $nationalId[0];
        $century = match ($centuryDigit) {
            2 => 1900,
            3 => 2000,
            default => null,
        };

        if (!$century) {
            return null;
        }

        $year = $century + (int) substr($nationalId, 1, 2);
        $month = (int) substr($nationalId, 3, 2);
        $day = (int) substr($nationalId, 5, 2);

        try {
            return Carbon::createFromDate($year, $month, $day);
        } catch (\Exception $e) {
            return null;
        }
    }
}