<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->json('clinic_anesthesia')->nullable()->after('programs');
            $table->json('clinic_spinal_surgery')->nullable()->after('clinic_anesthesia');
            $table->json('clinic_orthopedic')->nullable()->after('clinic_spinal_surgery');
            $table->json('clinic_cardiac')->nullable()->after('clinic_orthopedic');
            $table->json('clinic_colorectal')->nullable()->after('clinic_cardiac');
            $table->json('clinic_neurosurgery')->nullable()->after('clinic_colorectal');
            $table->json('clinic_urology')->nullable()->after('clinic_neurosurgery');
            $table->json('clinic_ent')->nullable()->after('clinic_urology');
            $table->json('clinic_general_surgery')->nullable()->after('clinic_ent');
            $table->json('clinic_maxillofacial')->nullable()->after('clinic_general_surgery');
            $table->json('clinic_reconstructive')->nullable()->after('clinic_maxillofacial');
            $table->json('clinic_abci')->nullable()->after('clinic_reconstructive');
            $table->json('clinic_hopbe')->nullable()->after('clinic_abci');
            $table->json('clinic_hypospadias')->nullable()->after('clinic_hopbe');
            $table->json('clinic_spina_bifida')->nullable()->after('clinic_hypospadias');
            $table->json('clinic_neurodevelopmental')->nullable()->after('clinic_spina_bifida');
            $table->json('clinic_dental')->nullable()->after('clinic_neurodevelopmental');
            $table->json('clinic_hope_start')->nullable()->after('clinic_dental');
            $table->json('clinic_liver_transplant')->nullable()->after('clinic_hope_start');
            $table->json('clinic_surgical_list')->nullable()->after('clinic_liver_transplant');
        });

        // Migrate existing programs data: split into per-clinic columns
        // and convert programs to a simple array of enrolled clinic label names
        $codeToColumn = [
            'anes'  => 'clinic_anesthesia',
            'spin'  => 'clinic_spinal_surgery',
            'orth'  => 'clinic_orthopedic',
            'hi'    => 'clinic_cardiac',
            'cprp'  => 'clinic_colorectal',
            'neur'  => 'clinic_neurosurgery',
            'urol'  => 'clinic_urology',
            'ent'   => 'clinic_ent',
            'gps'   => 'clinic_general_surgery',
            'maxf'  => 'clinic_maxillofacial',
            'recon' => 'clinic_reconstructive',
            'abci'  => 'clinic_abci',
            'hopb'  => 'clinic_hopbe',
            'hypo'  => 'clinic_hypospadias',
            'sbif'  => 'clinic_spina_bifida',
            'ndev'  => 'clinic_neurodevelopmental',
            'dent'  => 'clinic_dental',
            'hope'  => 'clinic_hope_start',
            'livt'  => 'clinic_liver_transplant',
            'surg'  => 'clinic_surgical_list',
        ];

        $codeToLabel = [
            'anes'  => 'Anesthesia Clinic',
            'spin'  => 'Spinal Surgery',
            'orth'  => 'Orthopedic Surgery',
            'hi'    => 'Cardiac Congenital',
            'cprp'  => 'Colorectal & Pelvic',
            'neur'  => 'Neurosurgery',
            'urol'  => 'Urology Surgery',
            'ent'   => 'ENT & Airway',
            'gps'   => 'General Pediatric Surgery',
            'maxf'  => 'Maxillofacial Surgery',
            'recon' => 'Reconstructive Surgery',
            'abci'  => 'ABCI (Cochlear Implant)',
            'hopb'  => 'HOPBE Program',
            'hypo'  => 'Hypospadias Clinic',
            'sbif'  => 'Spina Bifida Clinic',
            'ndev'  => 'Neurodevelopmental',
            'dent'  => 'Dental',
            'hope'  => 'Hope Start (Prenatal)',
            'livt'  => 'Liver Transplant',
            'surg'  => 'Surgical List',
        ];

        DB::table('cases')->orderBy('id')->each(function ($row) use ($codeToColumn, $codeToLabel) {
            if (empty($row->programs)) return;
            $programs = json_decode($row->programs, true);
            if (!is_array($programs)) return;

            $enrolledLabels = [];
            $updates = [];

            foreach ($programs as $code => $data) {
                if (!is_array($data)) continue;
                $column = $codeToColumn[$code] ?? null;
                $label  = $codeToLabel[$code] ?? null;
                $isEnrolled = !empty($data['enrolled']);

                if ($column) {
                    $updates[$column] = json_encode($data);
                }
                if ($isEnrolled && $label) {
                    $enrolledLabels[] = $label;
                }
            }

            $updates['programs'] = json_encode($enrolledLabels);
            DB::table('cases')->where('id', $row->id)->update($updates);
        });
    }

    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->dropColumn([
                'clinic_anesthesia', 'clinic_spinal_surgery', 'clinic_orthopedic',
                'clinic_cardiac', 'clinic_colorectal', 'clinic_neurosurgery',
                'clinic_urology', 'clinic_ent', 'clinic_general_surgery',
                'clinic_maxillofacial', 'clinic_reconstructive', 'clinic_abci',
                'clinic_hopbe', 'clinic_hypospadias', 'clinic_spina_bifida',
                'clinic_neurodevelopmental', 'clinic_dental', 'clinic_hope_start',
                'clinic_liver_transplant', 'clinic_surgical_list',
            ]);
        });
    }
};

