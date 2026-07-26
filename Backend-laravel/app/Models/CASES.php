<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class CASES extends Model
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
        'bas_soc_alarm_active',
        'bas_soc_alarm_date',
        'bas_soc_alarm_note',
        'bas_soc_alarm_priority',
        'programs',
        'research',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_joining_request' => 'date',
        'bas_soc_alarm_active' => 'boolean',
        'bas_soc_alarm_date' => 'date',
        'programs' => 'array',
        'research' => 'array',
    ];

    // funcs to extract the birthday and age automatically from the national id.
    protected static function booted(): void
    {
        static::saving(function (CASES $case) {
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