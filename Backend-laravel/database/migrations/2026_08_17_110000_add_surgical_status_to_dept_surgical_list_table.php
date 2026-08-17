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
        if (Schema::hasTable('dept_surgical_list')) {
            Schema::table('dept_surgical_list', function (Blueprint $table) {
                if (!Schema::hasColumn('dept_surgical_list', 'surgical_status')) {
                    $table->enum('surgical_status', [
                        'waiting_anesthesia_confirm',
                        'anesthesia_fit_ready',
                        'unfit',
                        'anesthesia_fit_checks_pending',
                        'completed'
                    ])->default('waiting_anesthesia_confirm')->after('operation_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('dept_surgical_list')) {
            Schema::table('dept_surgical_list', function (Blueprint $table) {
                if (Schema::hasColumn('dept_surgical_list', 'surgical_status')) {
                    $table->dropColumn('surgical_status');
                }
            });
        }
    }
};
