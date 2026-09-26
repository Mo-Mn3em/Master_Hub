<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('dept_liver_transplant')) {
            Schema::table('dept_liver_transplant', function (Blueprint $table) {
                if (!Schema::hasColumn('dept_liver_transplant', 'donner')) {
                    $table->text('donner')->nullable()->after('diagnosis_other');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('dept_liver_transplant')) {
            Schema::table('dept_liver_transplant', function (Blueprint $table) {
                if (Schema::hasColumn('dept_liver_transplant', 'donner')) {
                    $table->dropColumn('donner');
                }
            });
        }
    }
};
