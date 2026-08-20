<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Cases;
use App\Models\Department;
use App\Models\Dept;

class TenCasesSeeder extends Seeder
{
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Cases::truncate();
        DB::table('case_department')->truncate();
        foreach ([
            'dept_anesthesia', 'dept_spinal_surgery', 'dept_hopbe', 'dept_cardiac',
            'dept_colorectal', 'dept_orthopedic', 'dept_neurosurgery', 'dept_urology',
            'dept_ent', 'dept_general_surgery', 'dept_maxillofacial', 'dept_reconstructive',
            'dept_abci', 'dept_hope_start', 'dept_hypospadias', 'dept_spina_bifida',
            'dept_neurodevelopmental', 'dept_liver_transplant', 'dept_dental', 'dept_surgical_list'
        ] as $t) {
            DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $depts = Department::all()->keyBy('code');

        $casesData = [
            [
                'mrn' => 'MRN-2026-001',
                'full_name' => 'Youssef Mohamed Ali',
                'gender' => 'male',
                'national_id' => '31805120101234',
                'date_of_birth' => '2018-05-12',
                'age' => '8 years',
                'phone_number' => '01012345678',
                'government' => 'Cairo',
                'blood_group' => 'O+',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-01-10',
                'cause_of_acceptance' => 'Progressive early onset scoliosis requiring growing rods',
                'general_medical_history' => 'Diagnosed with early onset congenital scoliosis at age 4.',
                'social_notes' => 'Family lives in Cairo, parents cooperative.',
                'programs' => ['Spinal Surgery', 'Anesthesia Clinic'],
                'dept_spinal_surgery' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-01-15',
                    'last_visit_date' => '2026-08-01',
                    'primary_diagnosis' => 'scoliosis_congenital',
                    'op_decided' => 'yes',
                    'ct_done' => 'yes',
                    'mri_present' => 'yes',
                    'echo_done' => 'done',
                    'hardware_available' => 'available',
                    'neuro_monitoring' => 'confirmed',
                    'planned_operation' => 'Posterior Spinal Instrumentation & Fusion',
                    'detailed_history' => 'Curve progression > 45 degrees. Pre-op cardiac echo normal.',
                    'consent_status' => 'signed',
                    'labs_status' => 'done_free',
                    'blood_status' => 'ready',
                    'post_destination' => 'PICU',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-08-20',
                    'surgery_booking_note' => 'Booked for primary spine surgery',
                    'surgery_booking_priority' => 'red',
                ],
                'dept_anesthesia' => [
                    'status' => 'enrolled',
                    'assessment_status' => 'fit',
                    'assessment_date' => '2026-08-05',
                    'requested_operation' => 'Posterior Spine Surgery',
                    'consent_signed' => 'yes',
                    'cardiac_clear' => 'yes',
                    'rbc_units' => '2',
                    'rbc_status' => 'ready',
                    'overall_blood_ready' => 'ready',
                ],
                'enrolled_codes' => ['spin', 'anes'],
            ],
            [
                'mrn' => 'MRN-2026-002',
                'full_name' => 'Mariam Ahmed Hassan',
                'gender' => 'female',
                'national_id' => '32009200102345',
                'date_of_birth' => '2020-09-20',
                'age' => '5 years',
                'phone_number' => '01123456789',
                'government' => 'Giza',
                'blood_group' => 'A+',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-02-01',
                'cause_of_acceptance' => 'Large Ventricular Septal Defect with pulmonary hypertension',
                'general_medical_history' => 'Recurrent chest infections and failure to thrive.',
                'programs' => ['Cardiac Congenital', 'Anesthesia Clinic'],
                'dept_cardiac' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-02-05',
                    'last_visit_date' => '2026-08-02',
                    'primary_diagnosis' => 'vsd',
                    'intervention_category' => 'open_heart',
                    'blood_group' => 'A+',
                    'echo_recent' => 'done',
                    'ct_mri_done' => 'done',
                    'perfusionist_confirmed' => 'yes',
                    'planned_operation' => 'VSD Closure on CPB',
                    'detailed_history' => 'ECHO shows 8mm perimembranous VSD with left-to-right shunt.',
                    'consent_status' => 'signed',
                    'labs_status' => 'done_free',
                    'post_destination' => 'CICU',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-08-25',
                    'surgery_booking_priority' => 'red',
                ],
                'dept_anesthesia' => [
                    'status' => 'enrolled',
                    'assessment_status' => 'fit',
                    'assessment_date' => '2026-08-06',
                    'cardiac_clear' => 'yes',
                    'rbc_units' => '2',
                    'rbc_status' => 'ready',
                ],
                'enrolled_codes' => ['hi', 'anes'],
            ],
            [
                'mrn' => 'MRN-2026-003',
                'full_name' => 'Omar Khaled Mahmoud',
                'gender' => 'male',
                'national_id' => '32203150103456',
                'date_of_birth' => '2022-03-15',
                'age' => '4 years',
                'phone_number' => '01234567890',
                'government' => 'Alexandria',
                'blood_group' => 'B+',
                'motor_problem' => 'yes',
                'motor_problem_detail' => 'Limping gait due to right hip dislocation',
                'date_of_joining_request' => '2026-03-01',
                'cause_of_acceptance' => 'Untreated right DDH requiring open reduction and pelvic osteotomy',
                'programs' => ['Orthopedic Surgery'],
                'dept_orthopedic' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-03-10',
                    'last_visit_date' => '2026-07-28',
                    'primary_diagnosis' => 'ddh',
                    'limb_affected' => 'right_lower',
                    'xray_ct_done' => 'done',
                    'hardware_available' => 'available',
                    'planned_operation' => 'Right Open Hip Reduction + Salter Osteotomy',
                    'detailed_history' => 'Pelvic X-ray shows complete dislocation of right femoral head.',
                    'consent_status' => 'signed',
                    'labs_status' => 'done_free',
                    'post_destination' => 'Ward',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-09-01',
                    'surgery_booking_priority' => 'yellow',
                ],
                'enrolled_codes' => ['orth'],
            ],
            [
                'mrn' => 'MRN-2026-004',
                'full_name' => 'Nour Ibrahim El-Sayed',
                'gender' => 'female',
                'national_id' => '32311050104567',
                'date_of_birth' => '2023-11-05',
                'age' => '2 years',
                'phone_number' => '01098765432',
                'government' => 'Sharqia',
                'blood_group' => 'AB+',
                'motor_problem' => 'yes',
                'motor_problem_detail' => 'Paraparesis secondary to spina bifida',
                'date_of_joining_request' => '2026-03-15',
                'cause_of_acceptance' => 'Lumbar myelomeningocele with VP shunt malfunction',
                'programs' => ['Neurosurgery', 'Spina Bifida Clinic'],
                'dept_neurosurgery' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-03-20',
                    'primary_diagnosis' => 'hydrocephalus_congenital',
                    'detailed_history' => 'VP shunt inserted in infancy, now presents with mild headache and lethargy.',
                    'consent_status' => 'pending',
                ],
                'dept_spina_bifida' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-03-20',
                    'primary_lesion_level' => 'lumbar',
                    'shunt_status' => 'vp_shunt',
                    'detailed_history' => 'L3-L4 myelomeningocele repaired postnatally. Under multidisciplinary follow-up.',
                    'neuro_alarm_active' => true,
                    'neuro_alarm_date' => '2026-08-15',
                    'neuro_alarm_note' => 'Shunt revision consultation needed',
                    'neuro_alarm_priority' => 'red',
                ],
                'enrolled_codes' => ['neur', 'sbif'],
            ],
            [
                'mrn' => 'MRN-2026-005',
                'full_name' => 'Ziad Tarek Mostafa',
                'gender' => 'male',
                'national_id' => '32107180105678',
                'date_of_birth' => '2021-07-18',
                'age' => '5 years',
                'phone_number' => '01187654321',
                'government' => 'Dakahlia',
                'blood_group' => 'O-',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-04-01',
                'cause_of_acceptance' => 'Classic Bladder Exstrophy scheduled for staged pelvic closure',
                'programs' => ['HOPBE Program', 'Urology Surgery'],
                'dept_hopbe' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-04-05',
                    'primary_diagnosis' => 'classic_exstrophy',
                    'osteotomy_status' => 'notified',
                    'detailed_history' => 'Bladder template wide and suitable for primary closure with pelvic osteotomies.',
                    'consent_status' => 'signed',
                    'post_destination' => 'PICU',
                ],
                'dept_urology' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-04-05',
                    'primary_diagnosis' => 'bladder_exstrophy',
                    'detailed_history' => 'Scheduled for multidisciplinary HOPBE repair.',
                ],
                'enrolled_codes' => ['hopb', 'urol'],
            ],
            [
                'mrn' => 'MRN-2026-006',
                'full_name' => 'Farida Amr Abdelrahman',
                'gender' => 'female',
                'national_id' => '32402100106789',
                'date_of_birth' => '2024-02-10',
                'age' => '2 years',
                'phone_number' => '01287654321',
                'government' => 'Gharbia',
                'blood_group' => 'A-',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-04-10',
                'cause_of_acceptance' => 'Grade III Subglottic Stenosis post-prolonged neonatal intubation',
                'programs' => ['ENT & Airway'],
                'dept_ent' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-04-15',
                    'primary_diagnosis' => 'subglottic_stenosis',
                    'trach_status' => 'in_situ',
                    'planned_operation' => 'Laryngotracheal Reconstruction with Rib Cartilage Graft',
                    'detailed_history' => 'Tracheostomy performed at 6 months of age. Airway endoscopy confirmed stenosis.',
                    'consent_status' => 'signed',
                    'labs_status' => 'done_free',
                    'post_destination' => 'PICU',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-09-10',
                    'surgery_booking_priority' => 'red',
                ],
                'enrolled_codes' => ['ent'],
            ],
            [
                'mrn' => 'MRN-2026-007',
                'full_name' => 'Hamza Yasser Fathy',
                'gender' => 'male',
                'national_id' => '32501010107890',
                'date_of_birth' => '2025-01-01',
                'age' => '1 year',
                'phone_number' => '01033445566',
                'government' => 'Asyut',
                'blood_group' => 'B-',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-05-01',
                'cause_of_acceptance' => 'Late presenting Congenital Diaphragmatic Hernia',
                'programs' => ['General Pediatric Surgery', 'Surgical List'],
                'dept_general_surgery' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-05-05',
                    'primary_diagnosis' => 'cdh',
                    'planned_operation' => 'Laparoscopic / Open CDH Repair',
                    'detailed_history' => 'Left-sided CDH with stomach and bowel loops in hemithorax.',
                    'consent_status' => 'signed',
                    'post_destination' => 'NICU',
                ],
                'dept_surgical_list' => [
                    'status' => 'enrolled',
                    'operation_name' => 'CDH Repair Surgery',
                    'scheduled_date' => '2026-08-18',
                    'urgency' => 'urgent',
                    'consent_status' => 'signed',
                    'post_destination' => 'NICU',
                ],
                'enrolled_codes' => ['gps', 'surg'],
            ],
            [
                'mrn' => 'MRN-2026-008',
                'full_name' => 'Hana Sherif El-Ghandour',
                'gender' => 'female',
                'national_id' => '31912120108901',
                'date_of_birth' => '2019-12-12',
                'age' => '6 years',
                'phone_number' => '01144556677',
                'government' => 'Qalyubia',
                'blood_group' => 'O+',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-05-15',
                'cause_of_acceptance' => 'Low Anorectal Malformation post colostomy for definitive PSARP',
                'programs' => ['Colorectal & Pelvic'],
                'dept_colorectal' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-05-20',
                    'primary_diagnosis' => 'arm_low',
                    'continence_status' => 'impaired',
                    'planned_operation' => 'Posterior Sagittal Anorectoplasty (PSARP)',
                    'detailed_history' => 'Dividing colostomy performed in neonatal period. Distal colostogram shows low fistulous tract.',
                    'consent_status' => 'signed',
                    'labs_status' => 'done_free',
                    'post_destination' => 'Ward',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-09-15',
                    'surgery_booking_priority' => 'yellow',
                ],
                'enrolled_codes' => ['cprp'],
            ],
            [
                'mrn' => 'MRN-2026-009',
                'full_name' => 'Kareem Hossam Eldin',
                'gender' => 'male',
                'national_id' => '32208080109012',
                'date_of_birth' => '2022-08-08',
                'age' => '4 years',
                'phone_number' => '01255667788',
                'government' => 'Beheira',
                'blood_group' => 'A+',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-06-01',
                'cause_of_acceptance' => 'End-Stage Biliary Atresia failing Kasai procedure, evaluation for Pediatric Liver Transplant',
                'programs' => ['Liver Transplant'],
                'dept_liver_transplant' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-06-05',
                    'primary_diagnosis' => 'biliary_atresia',
                    'planned_operation' => 'Living Donor Liver Transplantation (LDLT)',
                    'detailed_history' => 'Progressive jaundice and portal hypertension. Mother is evaluated as potential donor.',
                    'consent_status' => 'pending',
                    'labs_status' => 'done_abnormal',
                    'prep_alarm_active' => true,
                    'prep_alarm_date' => '2026-08-12',
                    'prep_alarm_note' => 'Urgent liver transplant committee evaluation',
                    'prep_alarm_priority' => 'red',
                ],
                'enrolled_codes' => ['livt'],
            ],
            [
                'mrn' => 'MRN-2026-010',
                'full_name' => 'Laila Mahmoud Sameh',
                'gender' => 'female',
                'national_id' => '32004040100123',
                'date_of_birth' => '2020-04-04',
                'age' => '6 years',
                'phone_number' => '01066778899',
                'government' => 'Suez',
                'blood_group' => 'AB-',
                'motor_problem' => 'no',
                'date_of_joining_request' => '2026-06-15',
                'cause_of_acceptance' => 'Bilateral Profound Sensorineural Hearing Loss candidate for Cochlear Implant',
                'programs' => ['ABCI (Cochlear Implant)'],
                'dept_abci' => [
                    'status' => 'enrolled',
                    'first_visit_date' => '2026-06-20',
                    'primary_diagnosis' => 'snhl_bilateral_profound',
                    'planned_operation' => 'Right Cochlear Implant Surgery',
                    'detailed_history' => 'ABR confirmed bilateral profound hearing loss. Temporal CT/MRI shows normal cochlear anatomy.',
                    'consent_status' => 'signed',
                    'post_destination' => 'Ward',
                    'surgery_booking_active' => true,
                    'surgery_booking_date' => '2026-09-20',
                    'surgery_booking_priority' => 'yellow',
                ],
                'enrolled_codes' => ['abci'],
            ],
        ];

        foreach ($casesData as $c) {
            $enrolledCodes = $c['enrolled_codes'];
            unset($c['enrolled_codes']);

            $deptSpinalData = $c['dept_spinal_surgery'] ?? null; unset($c['dept_spinal_surgery']);
            $deptAnesData   = $c['dept_anesthesia'] ?? null;     unset($c['dept_anesthesia']);
            $deptCardData   = $c['dept_cardiac'] ?? null;        unset($c['dept_cardiac']);
            $deptOrthoData  = $c['dept_orthopedic'] ?? null;     unset($c['dept_orthopedic']);
            $deptNeurData   = $c['dept_neurosurgery'] ?? null;   unset($c['dept_neurosurgery']);
            $deptSbifData   = $c['dept_spina_bifida'] ?? null;   unset($c['dept_spina_bifida']);
            $deptHopbData   = $c['dept_hopbe'] ?? null;          unset($c['dept_hopbe']);
            $deptUrolData   = $c['dept_urology'] ?? null;        unset($c['dept_urology']);
            $deptEntData    = $c['dept_ent'] ?? null;            unset($c['dept_ent']);
            $deptGpsData    = $c['dept_general_surgery'] ?? null;unset($c['dept_general_surgery']);
            $deptSurgData   = $c['dept_surgical_list'] ?? null;  unset($c['dept_surgical_list']);
            $deptCprpData   = $c['dept_colorectal'] ?? null;     unset($c['dept_colorectal']);
            $deptLivtData   = $c['dept_liver_transplant'] ?? null;unset($c['dept_liver_transplant']);
            $deptAbciData   = $c['dept_abci'] ?? null;           unset($c['dept_abci']);

            if (isset($c['programs']) && is_array($c['programs'])) {
                $c['programs'] = implode("\n", $c['programs']);
            }

            $case = Cases::create($c);

            // Sync pure case_department pivot table
            $pivotIds = [];
            foreach ($enrolledCodes as $code) {
                if (isset($depts[$code])) {
                    $pivotIds[] = $depts[$code]->id;
                }
            }
            if (!empty($pivotIds)) {
                $case->departments()->sync($pivotIds);
            }

            // Dedicated department tables insertion
            if ($deptSpinalData) { Dept\DeptSpinalSurgery::create(array_merge(['case_id' => $case->id], $deptSpinalData)); }
            if ($deptAnesData)   { Dept\DeptAnesthesia::create(array_merge(['case_id' => $case->id], $deptAnesData)); }
            if ($deptCardData)   { Dept\DeptCardiac::create(array_merge(['case_id' => $case->id], $deptCardData)); }
            if ($deptOrthoData)  { Dept\DeptOrthopedic::create(array_merge(['case_id' => $case->id], $deptOrthoData)); }
            if ($deptNeurData)   { Dept\DeptNeurosurgery::create(array_merge(['case_id' => $case->id], $deptNeurData)); }
            if ($deptSbifData)   { Dept\DeptSpinaBifida::create(array_merge(['case_id' => $case->id], $deptSbifData)); }
            if ($deptHopbData)   { Dept\DeptHopbe::create(array_merge(['case_id' => $case->id], $deptHopbData)); }
            if ($deptUrolData)   { Dept\DeptUrology::create(array_merge(['case_id' => $case->id], $deptUrolData)); }
            if ($deptEntData)    { Dept\DeptEnt::create(array_merge(['case_id' => $case->id], $deptEntData)); }
            if ($deptGpsData)    { Dept\DeptGeneralSurgery::create(array_merge(['case_id' => $case->id], $deptGpsData)); }
            if ($deptSurgData)   { Dept\DeptSurgicalList::create(array_merge(['case_id' => $case->id], $deptSurgData)); }
            if ($deptCprpData)   { Dept\DeptColorectal::create(array_merge(['case_id' => $case->id], $deptCprpData)); }
            if ($deptLivtData)   { Dept\DeptLiverTransplant::create(array_merge(['case_id' => $case->id], $deptLivtData)); }
            if ($deptAbciData)   { Dept\DeptAbci::create(array_merge(['case_id' => $case->id], $deptAbciData)); }
        }
    }
}
