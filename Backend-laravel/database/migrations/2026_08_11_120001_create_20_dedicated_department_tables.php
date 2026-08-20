<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addCommonFields(Blueprint $table): void
    {
        $table->id();
        $table->foreignId('case_id')->unique()->constrained('cases')->onDelete('cascade');
        $table->string('status')->default('enrolled');
        $table->timestamp('enrolled_at')->nullable();
        $table->timestamp('discharged_at')->nullable();
        $table->date('first_visit_date')->nullable();
        $table->date('last_visit_date')->nullable();
        $table->text('detailed_history')->nullable();
        $table->string('planned_operation')->nullable();
        $table->text('journey_log')->nullable();

        // Pre-Op Gates
        $table->string('consent_status')->nullable();
        $table->string('labs_status')->nullable();
        $table->string('blood_status')->nullable();
        $table->string('post_destination')->nullable();
        $table->string('committee_approval')->nullable();

        // Surgery Booking Alarm
        $table->boolean('surgery_booking_active')->default(false);
        $table->date('surgery_booking_date')->nullable();
        $table->string('surgery_booking_note')->nullable();
        $table->enum('surgery_booking_priority', ['red', 'yellow', 'blue'])->default('red');

        // Followup Alarm
        $table->boolean('followup_alarm_active')->default(false);
        $table->date('followup_alarm_date')->nullable();
        $table->string('followup_alarm_note')->nullable();
        $table->enum('followup_alarm_priority', ['red', 'yellow', 'blue'])->default('red');

        $table->timestamps();
    }

    public function up(): void
    {
        // 1. dept_anesthesia
        Schema::create('dept_anesthesia', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('assessment_status')->nullable();
            $table->date('assessment_date')->nullable();
            $table->text('unfit_reason')->nullable();
            $table->string('requested_operation')->nullable();
            $table->date('requested_date')->nullable();
            $table->string('consent_signed')->nullable();
            $table->string('cardiac_clear')->nullable();
            $table->string('rbc_units')->nullable();
            $table->string('rbc_status')->nullable();
            $table->string('ffp_units')->nullable();
            $table->string('ffp_status')->nullable();
            $table->string('cryo_units')->nullable();
            $table->string('cryo_status')->nullable();
            $table->string('fwb_units')->nullable();
            $table->string('fwb_status')->nullable();
            $table->string('plt_units')->nullable();
            $table->string('plt_status')->nullable();
            $table->string('overall_blood_ready')->nullable();
            $table->text('anesthesia_feedback')->nullable();
            $table->date('approved_date')->nullable();
            $table->boolean('preop_alarm_active')->default(false);
            $table->date('preop_alarm_date')->nullable();
            $table->string('preop_alarm_note')->nullable();
            $table->enum('preop_alarm_priority', ['red', 'yellow', 'blue'])->default('red');
        });

        // 2. dept_spinal_surgery
        Schema::create('dept_spinal_surgery', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('op_decided')->nullable();
            $table->string('ct_done')->nullable();
            $table->string('mri_present')->nullable();
            $table->string('echo_done')->nullable();
            $table->string('hardware_available')->nullable();
            $table->string('neuro_monitoring')->nullable();
        });

        // 3. dept_hopbe
        Schema::create('dept_hopbe', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('osteotomy_status')->nullable();
        });

        // 4. dept_cardiac
        Schema::create('dept_cardiac', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('intervention_category')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('echo_recent')->nullable();
            $table->string('ct_mri_done')->nullable();
            $table->string('perfusionist_confirmed')->nullable();
        });

        // 5. dept_colorectal
        Schema::create('dept_colorectal', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('continence_status')->nullable();
        });

        // 6. dept_orthopedic
        Schema::create('dept_orthopedic', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('limb_affected')->nullable();
            $table->string('limb_other')->nullable();
            $table->string('xray_ct_done')->nullable();
            $table->string('hardware_available')->nullable();
        });

        // 7. dept_neurosurgery
        Schema::create('dept_neurosurgery', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 8. dept_urology
        Schema::create('dept_urology', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 9. dept_ent
        Schema::create('dept_ent', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('trach_status')->nullable();
        });

        // 10. dept_general_surgery
        Schema::create('dept_general_surgery', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 11. dept_maxillofacial
        Schema::create('dept_maxillofacial', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 12. dept_reconstructive
        Schema::create('dept_reconstructive', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 13. dept_abci
        Schema::create('dept_abci', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 14. dept_hope_start
        Schema::create('dept_hope_start', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('fetal_diagnosis')->nullable();
            $table->string('fetal_diagnosis_other')->nullable();
            $table->integer('gestational_age_weeks')->nullable();
        });

        // 15. dept_hypospadias
        Schema::create('dept_hypospadias', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('hypospadias_type')->nullable();
            $table->string('hypospadias_type_other')->nullable();
        });

        // 16. dept_spina_bifida
        Schema::create('dept_spina_bifida', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_lesion_level')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->string('shunt_status')->nullable();
            $table->boolean('neuro_alarm_active')->default(false);
            $table->date('neuro_alarm_date')->nullable();
            $table->string('neuro_alarm_note')->nullable();
            $table->enum('neuro_alarm_priority', ['red', 'yellow', 'blue'])->default('red');
        });

        // 17. dept_neurodevelopmental
        Schema::create('dept_neurodevelopmental', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
        });

        // 18. dept_liver_transplant
        Schema::create('dept_liver_transplant', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_diagnosis')->nullable();
            $table->string('diagnosis_other')->nullable();
            $table->boolean('prep_alarm_active')->default(false);
            $table->date('prep_alarm_date')->nullable();
            $table->string('prep_alarm_note')->nullable();
            $table->enum('prep_alarm_priority', ['red', 'yellow', 'blue'])->default('red');
        });

        // 19. dept_dental
        Schema::create('dept_dental', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('primary_condition')->nullable();
            $table->string('condition_other')->nullable();
        });

        // 20. dept_surgical_list
        Schema::create('dept_surgical_list', function (Blueprint $table) {
            $this->addCommonFields($table);
            $table->string('operation_name')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->string('urgency')->nullable();
            $table->date('fitness_date')->nullable();
            $table->date('approved_date')->nullable();
        });

        // Drop old clinic_* columns from cases table if they exist
        $clinicCols = [
            'clinic_anesthesia', 'clinic_spinal_surgery', 'clinic_orthopedic',
            'clinic_cardiac', 'clinic_colorectal', 'clinic_neurosurgery',
            'clinic_urology', 'clinic_ent', 'clinic_general_surgery',
            'clinic_maxillofacial', 'clinic_reconstructive', 'clinic_abci',
            'clinic_hopbe', 'clinic_hypospadias', 'clinic_spina_bifida',
            'clinic_neurodevelopmental', 'clinic_dental', 'clinic_hope_start',
            'clinic_liver_transplant', 'clinic_surgical_list',
        ];
        $existing = [];
        foreach ($clinicCols as $col) {
            if (Schema::hasColumn('cases', $col)) {
                $existing[] = $col;
            }
        }
        if (!empty($existing)) {
            Schema::table('cases', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'dept_anesthesia', 'dept_spinal_surgery', 'dept_hopbe', 'dept_cardiac',
            'dept_colorectal', 'dept_orthopedic', 'dept_neurosurgery', 'dept_urology',
            'dept_ent', 'dept_general_surgery', 'dept_maxillofacial', 'dept_reconstructive',
            'dept_abci', 'dept_hope_start', 'dept_hypospadias', 'dept_spina_bifida',
            'dept_neurodevelopmental', 'dept_liver_transplant', 'dept_dental', 'dept_surgical_list'
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
