<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update department names in departments table
        if (Schema::hasTable('departments')) {
            DB::table('departments')
                ->where('code', 'dent')
                ->update(['name' => 'Dental surgery']);

            DB::table('departments')
                ->where('code', 'maxf')
                ->update(['name' => 'Maxillofacial congenital surgeries']);
        }

        // 2. Ensure dept_dental supports primary_diagnosis and diagnosis_other alongside primary_condition
        if (Schema::hasTable('dept_dental')) {
            Schema::table('dept_dental', function (Blueprint $table) {
                if (!Schema::hasColumn('dept_dental', 'primary_diagnosis')) {
                    $table->string('primary_diagnosis')->nullable()->after('last_visit_date');
                }
                if (!Schema::hasColumn('dept_dental', 'diagnosis_other')) {
                    $table->string('diagnosis_other')->nullable()->after('primary_diagnosis');
                }
            });

            // Sync existing primary_condition data to primary_diagnosis if empty
            if (Schema::hasColumn('dept_dental', 'primary_condition') && Schema::hasColumn('dept_dental', 'primary_diagnosis')) {
                DB::statement('UPDATE dept_dental SET primary_diagnosis = primary_condition WHERE primary_diagnosis IS NULL AND primary_condition IS NOT NULL');
            }
            if (Schema::hasColumn('dept_dental', 'condition_other') && Schema::hasColumn('dept_dental', 'diagnosis_other')) {
                DB::statement('UPDATE dept_dental SET diagnosis_other = condition_other WHERE diagnosis_other IS NULL AND condition_other IS NOT NULL');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('departments')) {
            DB::table('departments')
                ->where('code', 'dent')
                ->update(['name' => 'Dental & Maxillofacial']);

            DB::table('departments')
                ->where('code', 'maxf')
                ->update(['name' => 'Maxillofacial Surgery']);
        }
    }
};
