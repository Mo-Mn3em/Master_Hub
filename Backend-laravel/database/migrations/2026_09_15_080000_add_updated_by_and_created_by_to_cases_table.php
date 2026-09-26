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
        if (Schema::hasTable('cases')) {
            Schema::table('cases', function (Blueprint $table) {
                if (!Schema::hasColumn('cases', 'created_by')) {
                    $table->string('created_by')->nullable()->after('research');
                }
                if (!Schema::hasColumn('cases', 'updated_by')) {
                    $table->string('updated_by')->nullable()->after('created_by');
                }
            });

            // Backfill existing records with realistic department coordinator attribution
            $deptCoordinatorMap = [
                'livt' => 'Nada.Salah',
                'hypo' => 'clara.youssef',
                'urol' => 'Loza khatab',
                'hi'   => 'Dina.eltayb',
                'gps'  => 'Rahma.Saleh',
                'neur' => 'manar.moustafa',
                'spin' => 'lujaina.Mohammed',
                'recon'=> 'lujaina.Mohammed',
                'orth' => 'Ahmed.Harfoush',
                'sbif' => 'Eslam.Elshieskh',
                'abci' => 'Abdelaziz.hosam',
                'dent' => 'Nada.Khairy',
                'maxf' => 'Nada.Khairy',
                'ndev' => 'manar.moustafa',
                'cprp' => 'Rahma.Saleh',
                'hopb' => 'Rahma.Saleh',
                'hope' => 'clara.youssef',
                'ent'  => 'Dina.eltayb',
                'anes' => 'hadeer.refaat',
            ];

            $allCases = DB::table('cases')->get();

            // Load case_department pivot mappings if table exists
            $pivotMap = [];
            if (Schema::hasTable('case_department') && Schema::hasTable('departments')) {
                $pivots = DB::table('case_department')
                    ->join('departments', 'case_department.department_id', '=', 'departments.id')
                    ->select('case_department.case_id', 'departments.code')
                    ->get();

                foreach ($pivots as $pivot) {
                    $pivotMap[$pivot->case_id][] = strtolower($pivot->code);
                }
            }

            foreach ($allCases as $c) {
                $assignedCoordinator = null;

                // 1. Check pivot relations first (prefer specialized departments over anes)
                $codes = $pivotMap[$c->id] ?? [];
                foreach ($deptCoordinatorMap as $code => $coord) {
                    if ($code !== 'anes' && in_array($code, $codes)) {
                        $assignedCoordinator = $coord;
                        break;
                    }
                }
                if (!$assignedCoordinator && in_array('anes', $codes)) {
                    $assignedCoordinator = 'hadeer.refaat';
                }

                // 2. Check programs string
                if (!$assignedCoordinator && !empty($c->programs)) {
                    $progStr = strtolower($c->programs);
                    if (str_contains($progStr, 'liver') || str_contains($progStr, 'livt')) {
                        $assignedCoordinator = 'Nada.Salah';
                    } elseif (str_contains($progStr, 'hypospadias') || str_contains($progStr, 'hypo')) {
                        $assignedCoordinator = 'clara.youssef';
                    } elseif (str_contains($progStr, 'spinal') || str_contains($progStr, 'spin')) {
                        $assignedCoordinator = 'lujaina.Mohammed';
                    } elseif (str_contains($progStr, 'reconstructive') || str_contains($progStr, 'recon')) {
                        $assignedCoordinator = 'lujaina.Mohammed';
                    } elseif (str_contains($progStr, 'orthopedic') || str_contains($progStr, 'orth')) {
                        $assignedCoordinator = 'Ahmed.Harfoush';
                    } elseif (str_contains($progStr, 'urology') || str_contains($progStr, 'urol')) {
                        $assignedCoordinator = 'Loza khatab';
                    } elseif (str_contains($progStr, 'cardiac') || str_contains($progStr, 'hi')) {
                        $assignedCoordinator = 'Dina.eltayb';
                    } elseif (str_contains($progStr, 'general') || str_contains($progStr, 'gps')) {
                        $assignedCoordinator = 'Rahma.Saleh';
                    } elseif (str_contains($progStr, 'neuro') || str_contains($progStr, 'neur')) {
                        $assignedCoordinator = 'manar.moustafa';
                    } elseif (str_contains($progStr, 'bifida') || str_contains($progStr, 'sbif')) {
                        $assignedCoordinator = 'Eslam.Elshieskh';
                    } elseif (str_contains($progStr, 'dental') || str_contains($progStr, 'dent')) {
                        $assignedCoordinator = 'Nada.Khairy';
                    } elseif (str_contains($progStr, 'maxillofacial') || str_contains($progStr, 'maxf')) {
                        $assignedCoordinator = 'Nada.Khairy';
                    } elseif (str_contains($progStr, 'abci')) {
                        $assignedCoordinator = 'Abdelaziz.hosam';
                    } elseif (str_contains($progStr, 'anesthesia') || str_contains($progStr, 'anes')) {
                        $assignedCoordinator = 'hadeer.refaat';
                    }
                }

                if (!$assignedCoordinator) {
                    $assignedCoordinator = 'admin';
                }

                DB::table('cases')->where('id', $c->id)->update([
                    'created_by' => $c->created_by ?: $assignedCoordinator,
                    'updated_by' => $c->updated_by ?: $assignedCoordinator,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cases')) {
            Schema::table('cases', function (Blueprint $table) {
                if (Schema::hasColumn('cases', 'updated_by')) {
                    $table->dropColumn('updated_by');
                }
                if (Schema::hasColumn('cases', 'created_by')) {
                    $table->dropColumn('created_by');
                }
            });
        }
    }
};
