<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void{

        // Creates the cases table in DB with full support for demographics, social notes, alarms, and department programs
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('mrn')->unique();
            $table->string('full_name');
            $table->enum('gender', ['male', 'female']);
            $table->string('national_id', 14)->nullable()->unique();
            $table->date('date_of_birth')->nullable();
            $table->string('age')->nullable();
            $table->string('phone_number', 50)->nullable();
            $table->string('government')->nullable();
            $table->string('outside_egypt_details')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->string('motor_problem')->nullable();
            $table->string('motor_problem_detail')->nullable();
            $table->date('date_of_joining_request')->nullable();
            $table->text('cause_of_acceptance')->nullable();
            $table->text('general_medical_history')->nullable();
            $table->text('social_notes')->nullable();

            // Social Followup Alarm fields
            $table->boolean('bas_soc_alarm_active')->default(false);
            $table->date('bas_soc_alarm_date')->nullable();
            $table->string('bas_soc_alarm_note')->nullable();
            $table->enum('bas_soc_alarm_priority', ['red', 'yellow', 'blue'])->default('red');

            // Department Clinic Enrollments & Department Data JSON
            $table->json('programs')->nullable();
            $table->json('research')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};