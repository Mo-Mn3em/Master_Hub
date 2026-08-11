<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create master departments table
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('color')->nullable();
            $table->string('pfx')->nullable();
            $table->timestamps();
        });

        $departments = [
            ['code' => 'anes', 'name' => 'Anesthesia Clinic',         'color' => '#8E44AD', 'pfx' => 'anes'],
            ['code' => 'spin', 'name' => 'Spinal Surgery',            'color' => '#E67E22', 'pfx' => 'spin'],
            ['code' => 'hopb', 'name' => 'HOPBE Program',             'color' => '#1ABC9C', 'pfx' => 'hop'],
            ['code' => 'hi',   'name' => 'Cardiac Congenital',        'color' => '#E74C3C', 'pfx' => 'hi'],
            ['code' => 'cprp', 'name' => 'Colorectal & Pelvic',       'color' => '#9B59B6', 'pfx' => 'cprp'],
            ['code' => 'orth', 'name' => 'Orthopedic Surgery',        'color' => '#2ECC71', 'pfx' => 'orth'],
            ['code' => 'neur', 'name' => 'Neurosurgery',              'color' => '#3498DB', 'pfx' => 'neur'],
            ['code' => 'urol', 'name' => 'Urology Surgery',           'color' => '#F39C12', 'pfx' => 'urol'],
            ['code' => 'ent',  'name' => 'ENT & Airway',              'color' => '#1ABC9C', 'pfx' => 'ent'],
            ['code' => 'gps',  'name' => 'General Pediatric Surgery', 'color' => '#E67E22', 'pfx' => 'gps'],
            ['code' => 'maxf', 'name' => 'Maxillofacial Surgery',     'color' => '#8E44AD', 'pfx' => 'maxf'],
            ['code' => 'recon', 'name' => 'Reconstructive Surgery',   'color' => '#E91E63', 'pfx' => 'recon'],
            ['code' => 'abci', 'name' => 'ABCI (Cochlear Implant)',   'color' => '#34495E', 'pfx' => 'abci'],
            ['code' => 'hope', 'name' => 'Hope Start (Prenatal)',     'color' => '#F1C40F', 'pfx' => 'hope'],
            ['code' => 'hypo', 'name' => 'Hypospadias Clinic',        'color' => '#16A085', 'pfx' => 'hypo'],
            ['code' => 'sbif', 'name' => 'Spina Bifida Clinic',       'color' => '#2980B9', 'pfx' => 'sbif'],
            ['code' => 'ndev', 'name' => 'Neurodevelopmental',      'color' => '#8E44AD', 'pfx' => 'ndev'],
            ['code' => 'livt', 'name' => 'Liver Transplant',          'color' => '#D35400', 'pfx' => 'livt'],
            ['code' => 'dent', 'name' => 'Dental & Maxillofacial',    'color' => '#7F8C8D', 'pfx' => 'dent'],
            ['code' => 'surg', 'name' => 'Surgical List',             'color' => '#C0392B', 'pfx' => 'surg'],
        ];

        $now = now();
        foreach ($departments as &$dept) {
            $dept['created_at'] = $now;
            $dept['updated_at'] = $now;
        }
        DB::table('departments')->insert($departments);

        // 2. Create pure case_department pivot table (without extra status/department_data/enrolled_at/discharged_at columns)
        Schema::create('case_department', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['case_id', 'department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_department');
        Schema::dropIfExists('departments');
    }
};
