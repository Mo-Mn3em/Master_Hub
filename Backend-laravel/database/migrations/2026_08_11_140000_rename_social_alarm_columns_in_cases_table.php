<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->renameColumn('bas_soc_alarm_active', 'social_alarm_active');
            $table->renameColumn('bas_soc_alarm_date', 'social_alarm_date');
            $table->renameColumn('bas_soc_alarm_note', 'social_alarm_note');
            $table->renameColumn('bas_soc_alarm_priority', 'social_alarm_priority');
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->renameColumn('social_alarm_active', 'bas_soc_alarm_active');
            $table->renameColumn('social_alarm_date', 'bas_soc_alarm_date');
            $table->renameColumn('social_alarm_note', 'bas_soc_alarm_note');
            $table->renameColumn('social_alarm_priority', 'bas_soc_alarm_priority');
        });
    }
};
