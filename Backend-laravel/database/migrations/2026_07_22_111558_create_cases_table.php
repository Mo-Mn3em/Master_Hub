<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void{

        //func will create the columns in the DB after running the migration command.
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('mrn')->unique();
            $table->string('full_name');
            $table->enum('gender', ['male', 'female']);
            $table->string('national_id', 14)->unique();
            $table->date('date_of_birth')->nullable();
            $table->unsignedTinyInteger('age')->nullable();
            $table->string('phone_number', 11);
            $table->enum('government', [
                'cairo', 'giza', 'alexandria', 'qalyubia', 'port_said', 'suez',
                'dakahlia', 'sharqia', 'gharbia', 'monufia', 'beheira', 'kafr_el_sheikh',
                'damietta', 'ismailia', 'fayoum', 'beni_suef', 'minya', 'assiut',
                'sohag', 'qena', 'luxor', 'aswan', 'red_sea', 'new_valley',
                'matrouh', 'north_sinai', 'south_sinai', 'outside_egypt',
            ]);
            $table->string('outside_egypt_details')->nullable();
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
            $table->enum('motor_problem', ['can_move', 'cannot_move']);
            $table->date('date_of_joining_request');
            $table->enum('cause_of_acceptance', ['accepted', 'not_accepted']);
            $table->text('general_medical_history')->nullable();
            $table->timestamps();
        });
    }

    //func to rollback from the exestiing migration and delete the table.
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};