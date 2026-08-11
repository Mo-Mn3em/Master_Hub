import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Patient } from '../../types';
import DEPARTMENTS from '../../utils/departmentsData';
import { getDynamicAge, REPORT_LBL_MAP } from '../../utils/clinicalRules';
import { exportAnalyticsToExcel } from '../../utils/excel';
import { Calendar, Filter, BarChart3, TrendingUp, AlertTriangle, Users, Award, Download, ArrowRight } from 'lucide-react';

const DIAGNOSIS_LABEL_MAP: { [key: string]: string } = {
  // Spine
  'scoliosis_early': 'Idiopathic Scoliosis - Early Onset',
  'scoliosis_adolescent': 'Idiopathic Scoliosis - Adolescent',
  'scoliosis_congenital': 'Congenital Scoliosis',
  'scoliosis_neuromuscular': 'Neuromuscular Scoliosis',
  'scoliosis_syndromic': 'Syndromic Scoliosis',
  'kyphosis': 'Kyphosis - Congenital / Scheuermann\'s',
  'spina_bifida': 'Spina Bifida / MMC',
  'tethered_cord': 'Tethered Cord Syndrome',
  'diastematomyelia': 'Diastematomyelia',
  'hemivertebra': 'Hemivertebra',
  'sacral_agenesis': 'Sacral Agenesis / Caudal Regression',
  'klippel_feil': 'Klippel-Feil Syndrome',
  'spondylolysis': 'Spondylolysis / Spondylolisthesis',
  'spine_trauma': 'Pediatric Spine Fracture / Trauma',
  'atlantoaxial_instability': 'Atlantoaxial Instability',
  'spine_tumor_bone': 'Spinal Tumor - Bone / Primary',
  'spine_tumor_neural': 'Intraspinal / Neural Tumor',
  'spondylodiscitis': 'Spondylodiscitis / Osteomyelitis',

  // HOPBE
  'classic_exstrophy': 'Classic Bladder Exstrophy',
  'cloacal_exstrophy': 'Cloacal Exstrophy',
  'epispadias_male': 'Epispadias (Male)',
  'epispadias_female': 'Epispadias (Female)',
  'exstrophy_variant': 'Exstrophy Variant / Pseudoexstrophy',

  // Cardiac Congenital
  'vsd': 'Ventricular Septal Defect (VSD)',
  'asd': 'Atrial Septal Defect (ASD)',
  'pda': 'Patent Ductus Arteriosus (PDA)',
  'avsd': 'Atrioventricular Septal Defect (AVSD)',
  'ap_window': 'Aortopulmonary (AP) Window',
  'cor_triatriatum': 'Cor Triatriatum',
  'tof': 'Tetralogy of Fallot (TOF)',
  'tga': 'Transposition of the Great Arteries (TGA / ccTGA)',
  'truncus': 'Truncus Arteriosus',
  'tapvr': 'Total Anomalous Pulm. Venous Return (TAPVR)',
  'tricuspid_atresia': 'Tricuspid Atresia',
  'pulmonary_atresia': 'Pulmonary Atresia (PA / MAPCAs)',
  'hlhs': 'Hypoplastic Left Heart Syndrome (HLHS)',
  'dorv': 'Double Outlet Right Ventricle (DORV)',
  'ebstein': 'Ebstein Anomaly',
  'heterotaxy': 'Heterotaxy / Isomerism Syndromes',
  'coa': 'Coarctation of the Aorta (CoA)',
  'iaa': 'Interrupted Aortic Arch (IAA)',
  'aortic_stenosis': 'Aortic Stenosis (AS)',
  'pulmonary_stenosis': 'Pulmonary Stenosis (PS)',
  'shones': 'Shone\'s Complex',
  'vascular_ring': 'Vascular Rings / Pulmonary Slings',
  'alcapa': 'ALCAPA / Coronary Anomalies',
  'congenital_mitral': 'Congenital Mitral / Tricuspid Valve Disease',
  'cardiomyopathy': 'Cardiomyopathy / Heart Failure',
  'rheumatic': 'Rheumatic Heart Disease (RHD)',
  'kawasaki': 'Kawasaki Disease (Coronary Aneurysm)',
  'arrhythmia': 'Arrhythmia / Congenital Heart Block',

  // Colorectal
  'arm_low': 'Low ARM (e.g., Perineal / Vestibular)',
  'arm_high': 'High / Intermediate ARM',
  'arm_without_fistula': 'Imperforate Anus (No Fistula)',
  'cloaca': 'Cloacal Malformation',
  'hirschsprung': 'Hirschsprung Disease (HD)',
  'tca': 'Total Colonic Aganglionosis (TCA)',
  'motility_disorder': 'Intestinal Motility Disorder',
  'bladder_exstrophy': 'Classic Bladder Exstrophy',
  'urogenital_sinus': 'Urogenital Sinus (UGS)',
  'dsd_cah': 'DSD / CAH',
  'vaginal_agenesis': 'Vaginal Agenesis / MRKH',
  'hydrocolpos': 'Hydrocolpos / Vaginal Atresia',
  'ovarian_mass': 'Ovarian Cyst / Tumor',
  'neurogenic_bladder': 'Neurogenic Bladder',
  'patent_urachus': 'Patent Urachus / Urachal Cyst',
  'rectal_prolapse': 'Rectal Prolapse',
  'rectal_polyp': 'Rectal Polyp',
  'fecal_incontinence': 'Severe Constipation / Fecal Incontinence',
  'colostomy_closure': 'Status Post Colostomy (Closure)',
  'redo_surgery': 'Redo Surgery',

  // Ortho
  'cp': 'Cerebral Palsy (CP)',
  'amc': 'Arthrogryposis (AMC)',
  'oi': 'Osteogenesis Imperfecta (OI)',
  'muscular_dystrophy': 'Muscular Dystrophy',
  'ddh': 'Developmental Dysplasia of the Hip (DDH)',
  'perthes': 'Legg-Calve-Perthes Disease',
  'scfe': 'Slipped Capital Femoral Emiphysis (SCFE)',
  'coxa_vara': 'Coxa Vara',
  'clubfoot': 'Clubfoot (CTEV)',
  'flatfoot': 'Pes Planovalgus (Flatfoot)',
  'cavus': 'Pes Cavovarus (Cavus Foot)',
  'cvt': 'Congenital Vertical Talus (CVT)',
  'tarsal_coalition': 'Tarsal Coalition',
  'metatarsus_adductus': 'Metatarsus Adductus',
  'genu_varum': 'Genu Varum / Blount\'s Disease',
  'genu_valgum': 'Genu Valgum (Knock Knees)',
  'cpt': 'Congenital Pseudarthrosis of Tibia',
  'hemimelia': 'Fibular / Tibial Hemimelia',
  'pffd': 'Proximal Focal Femoral Deficiency (PFFD)',
  'lld': 'Leg Length Discrepancy (LLD)',
  'polydactyly': 'Polydactyly / Syndactyly',
  'radial_club_hand': 'Radial / Ulnar Club Hand',
  'trigger_thumb': 'Trigger Thumb / Finger',
  'amniotic_band': 'Amniotic Band Syndrome',
  'erbs_palsy': 'Brachial Plexus Birth Palsy',
  'fracture': 'Fracture / Malunion / Non-union',
  'infection': 'Osteomyelitis / Septic Arthritis',
  'bone_cyst': 'Bone Cyst (UBC / ABC)',
  'osteochondroma': 'Osteochondroma / MHE',
  'tumor_malignant': 'Malignant Bone Tumor',

  // Neuro
  'hydrocephalus_congenital': 'Congenital Hydrocephalus',
  'hydrocephalus_post': 'Post-Hemorrhagic / Post-Infectious Hydrocephalus',
  'arachnoid_cyst': 'Arachnoid Cyst',
  'dandy_walker': 'Dandy-Walker Malformation',
  'encephalocele': 'Encephalocele',
  'chiari': 'Chiari Malformation (Type I / II)',
  'craniosynostosis': 'Craniosynostosis',
  'epilepsy_surg': 'Epilepsy (Surgical Candidate)',
  'spasticity': 'Spasticity (SDR / Pump)',
  'tbi_skull_fx': 'Pediatric TBI / Skull Fracture',

  // Urology
  'hydronephrosis_pujo': 'Hydronephrosis / PUJO',
  'megaureter': 'UVJ Obstruction / Megaureter',
  'ureterocele': 'Ureterocele / Ectopic Ureter',
  'mcdk': 'Multicystic Dysplastic Kidney (MCDK)',
  'vur': 'Vesicoureteral Reflux (VUR)',
  'puv': 'Posterior Urethral Valves (PUV)',
  'urachal': 'Urachal Anomaly',
  'prune_belly': 'Prune Belly Syndrome',
  'hypospadias': 'Hypospadias / Chordee',
  'cryptorchidism': 'Undescended Testis (Cryptorchidism)',
  'dsd': 'Disorders of Sex Development (DSD)',
  'hydrocele_varicocele': 'Hydrocele / Varicocele / Torsion',
  'wilms_tumor': 'Wilms Tumor / Renal Mass',
  'rhabdomyosarcoma': 'Rhabdomyosarcoma (GU)',

  // ENT
  'subglottic_stenosis': 'Subglottic Stenosis',
  'laryngomalacia': 'Laryngomalacia',
  'tracheomalacia': 'Tracheomalacia',
  'choanal_atresia': 'Choanal Atresia',
  'laryngeal_web': 'Laryngeal Web',
  'laryngeal_cleft': 'Laryngeal Cleft',
  'vocal_cord_paralysis': 'Congenital Vocal Cord Paralysis',
  'microtia': 'Microtia / Aural Atresia',
  'otitis_media': 'Chronic Otitis Media / Effusion',
  'cholesteatoma': 'Cholesteatoma',
  'branchial_cleft': 'Branchial Cleft Cyst / Sinus',
  'thyroglossal': 'Thyroglossal Duct Cyst',
  'cystic_hygroma': 'Cystic Hygroma / Lymphangioma',
  'adenotonsillar': 'Adenotonsillar Hypertrophy',
  'tongue_tie': 'Ankyloglossia (Tongue Tie)',

  // General Pediatric Surgery (GPS)
  'duodenal_atresia': 'Duodenal Atresia / Web',
  'jejunoileal_atresia': 'Jejunoileal Atresia',
  'nec': 'Necrotizing Enterocolitis (NEC)',
  'pyloric_stenosis': 'Hypertrophic Pyloric Stenosis',
  'malrotation': 'Malrotation / Midgut Volvulus',
  'intussusception': 'Intussusception',
  'meckels': 'Meckel\'s Diverticulum',
  'appendicitis': 'Appendicitis',
  'ea_tef': 'Esophageal Atresia (EA) / TEF',
  'cdh': 'Congenital Diaphragmatic Hernia (CDH)',
  'cpam_bps': 'CPAM / Lung Lesion',
  'pectus': 'Pectus Excavatum / Carinatum',
  'gastroschisis': 'Gastroschisis',
  'omphalocele': 'Omphalocele',
  'inguinal_hernia': 'Inguinal Hernia / Hydrocele',
  'umbilical_hernia': 'Umbilical / Epigastric Hernia',
  'neuroblastoma': 'Neuroblastoma',
  'wilms': 'Wilms Tumor (Nephroblastoma)',
  'hepatoblastoma': 'Hepatoblastoma',
  'sct': 'Sacrococcygeal Teratoma (SCT)',

  // Maxillofacial (MAXF)
  'cleft_lip': 'Cleft Lip',
  'cleft_palate': 'Cleft Palate',
  'submucous_cleft': 'Submucous Cleft Palate',
  'pierre_robin': 'Pierre Robin Sequence',
  'treacher_collins': 'Treacher Collins Syndrome',
  'hemifacial_microsomia': 'Hemifacial Microsomia',
  'hemangioma': 'Hemangioma',
  'vascular_malformation': 'Vascular Malformation',
  'jaw_tumor': 'Mandibular / Maxillary Cyst or Tumor',

  // Reconstructive
  'post_burn_contracture': 'Post-Burn Contracture',
  'keloid_hypertrophic': 'Keloid / Hypertrophic Scar',
  'acute_burn': 'Acute Burn Injury',
  'congenital_nevus': 'Giant Congenital Nevus',
  'ear_anomaly': 'Microtia / Prominent Ear',
  'soft_tissue_loss': 'Soft Tissue Defect / Loss',
  'nerve_injury': 'Peripheral Nerve Injury',

  // ABCI
  'snhl_bilateral_profound': 'Bilateral Profound SNHL',
  'snhl_bilateral_severe': 'Bilateral Severe SNHL',
  'snhl_unilateral': 'Unilateral SNHL',
  'auditory_neuropathy': 'Auditory Neuropathy Spectrum',
  'cochlear_anomaly': 'Congenital Cochlear Anomaly',
  'post_meningitis': 'Post-Meningitis Ossification',

  // Hope Start
  'fetal_mmc': 'Fetal Myelomeningocele (MMC)',
  'fetal_hydrocephalus': 'Fetal Hydrocephalus',
  'fetal_encephalocele': 'Encephalocele',
  'fetal_cdh': 'Congenital Diaphragmatic Hernia (CDH)',
  'fetal_cpam': 'CPAM / Lung Lesion',
  'fetal_chaost': 'CHAOS',
  'fetal_neck_mass': 'Fetal Neck Mass',
  'fetal_gastroschisis': 'Gastroschisis',
  'fetal_omphalocele': 'Omphalocele',
  'fetal_bowel_atresia': 'Bowel Atresia',
  'fetal_luto': 'Lower Urinary Tract Obstruction (LUTO)',
  'fetal_sct': 'Sacrococcygeal Teratoma (SCT)',
  'fetal_ttts': 'TTTS / TRAP Sequence',

  // Hypospadias
  'glanular': 'Glanular Hypospadias',
  'coronal': 'Coronal Hypospadias',
  'subcoronal': 'Subcoronal Hypospadias',
  'distal_penile': 'Distal Penile Hypospadias',
  'midshaft': 'Midshaft Hypospadias',
  'proximal_penile': 'Proximal Penile Hypospadias',
  'penoscrotal': 'Penoscrotal Hypospadias',
  'scrotal': 'Scrotal Hypospadias',
  'perineal': 'Perineal Hypospadias',
  'fistula': 'Urethrocutaneous Fistula (Post-op)',
  'stricture': 'Urethral Stricture / Stenosis',
  'chordee_only': 'Chordee Without Hypospadias',

  // Spina Bifida
  'cervical': 'Cervical Spinal Lesion',
  'thoracic': 'Thoracic Spinal Lesion',
  'lumbar': 'Lumbar Spinal Lesion',
  'sacral': 'Sacral Spinal Lesion',
  'lipomeningocele': 'Lipomeningocele'
};

interface TrendBadgeProps {
  current: number;
  previous: number;
  invert?: boolean;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ current, previous, invert = false }) => {
  if (!previous || previous === 0) return null;
  const delta = current - previous;
  const pct = Math.round((Math.abs(delta) / previous) * 100);
  if (delta === 0) return <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>➖ 0%</span>;
  
  const isGood = invert ? delta < 0 : delta > 0;
  const color = isGood ? '#15803D' : '#DC2626';
  const arrow = delta > 0 ? '▲' : '▼';
  return (
    <span style={{ fontSize: '10px', color, marginLeft: '6px', fontWeight: 700 }}>
      {arrow} {pct}%
    </span>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  const { patients } = useApp();

  // Dates state (default to past year)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [deptFilter, setDeptFilter] = useState('all');

  const [metrics, setMetrics] = useState({
    totalFirstVisits: 0,
    totalDecidedCases: 0,
    currentlyWaiting: 0,
    completedOperations: 0,
    avgWaitVisit: 0,
    avgWaitDecision: 0,
    avgLOS: 0,
    acuity: { red: 0, yellow: 0, blue: 0 },
    acuityEscalations: 0,
    demographics: {} as { [key: string]: number },
    genders: { male: 0, female: 0, Unknown: 0 } as { [key: string]: number },
    diagnoses: {} as { [key: string]: number },
    destinations: {} as { [key: string]: number },
    bloodNeeded: 0,
    bloodTypes: {} as { [key: string]: number },
    blockers: {} as { [key: string]: number },
    cancelReasons: {} as { [key: string]: number },
    cancelTypes: { permanent: 0, reversible: 0 },
    anesRejects: {} as { [key: string]: number }
  });

  const [prevMetrics, setPrevMetrics] = useState({
    totalFirstVisits: 0,
    totalDecidedCases: 0,
    completedOperations: 0
  });

  // Calculate metrics based on parameters (parses visit dates and historical logs)
  useEffect(() => {
    const dFrom = new Date(dateFrom + 'T00:00:00'); dFrom.setHours(0,0,0,0);
    const dTo = new Date(dateTo + 'T23:59:59'); dTo.setHours(23,59,59,999);
    const today = new Date(); today.setHours(0,0,0,0);
    
    // Calculate previous period exact length
    const periodDelta = dTo.getTime() - dFrom.getTime();
    const pTo = new Date(dFrom.getTime() - 1); 
    const pFrom = new Date(pTo.getTime() - periodDelta);
    pFrom.setHours(0,0,0,0); pTo.setHours(23,59,59,999);

    const metricsData = {
      totalFirstVisits: 0, totalDecidedCases: 0, currentlyWaiting: 0, completedOperations: 0,
      sumWaitFromVisit: 0, countWaitFromVisit: 0, sumWaitFromDecision: 0, countWaitFromDecision: 0,
      sumLOS: 0, countLOS: 0, lateCancellations: 0,
      acuity: { red: 0, yellow: 0, blue: 0 }, acuityEscalations: 0,
      demographics: {} as { [key: string]: number },
      genders: { male: 0, female: 0, Unknown: 0 } as { [key: string]: number },
      diagnoses: {} as { [key: string]: number },
      destinations: {} as { [key: string]: number },
      bloodNeeded: 0,
      bloodTypes: {} as { [key: string]: number },
      blockers: {} as { [key: string]: number },
      cancelReasons: {} as { [key: string]: number },
      cancelTypes: { permanent: 0, reversible: 0 },
      anesRejects: {} as { [key: string]: number }
    };
    
    const prevMetricsData = {
      totalFirstVisits: 0, totalDecidedCases: 0, completedOperations: 0
    };

    patients.forEach(p => {
      if (p.isArchived) return;

      let deptsToAnalyze: typeof DEPARTMENTS = [];
      if (deptFilter === 'all') {
        deptsToAnalyze = DEPARTMENTS.filter(d => d.code !== 'anes' && d.code !== 'surg');
      } else {
        const targetDept = DEPARTMENTS.find(d => d.code === deptFilter);
        if (targetDept) deptsToAnalyze.push(targetDept);
      }

      let patientCountedForDemographics = false;
      let patientCountedForBlood = false;
      const countedVisits = new Set<string>();

      deptsToAnalyze.forEach(dept => {
        const prog = p.programs?.[dept.code];
        const pfx = dept.pfx || dept.code;

        // 1. Process Historical (Completed) Operations first
        if (p.historical_operations) {
          Object.values(p.historical_operations).forEach((snap: any) => {
            if (snap.deptCode === dept.code) {
              if (!snap.visitDate) return;
              const snapVisitDate = new Date(snap.visitDate + 'T00:00:00');

              if (snapVisitDate >= dFrom && snapVisitDate <= dTo) {
                const vKey = `${dept.code}_${snap.visitDate}`;
                if (!countedVisits.has(vKey)) {
                  metricsData.totalFirstVisits++;
                  countedVisits.add(vKey);

                  if (!patientCountedForDemographics) {
                    const gov = p.bas_gov || 'Unknown / Not Set';
                    metricsData.demographics[gov] = (metricsData.demographics[gov] || 0) + 1;
                    const gender = p.bas_gender || 'Unknown';
                    metricsData.genders[gender] = (metricsData.genders[gender] || 0) + 1;
                    patientCountedForDemographics = true;
                  }
                }

                metricsData.totalDecidedCases++;
                metricsData.completedOperations++;
                if (snap.losDays !== undefined && snap.losDays !== null) {
                  metricsData.sumLOS += Number(snap.losDays);
                  metricsData.countLOS++;
                }

                const endDate = new Date(snap.doneDate + 'T00:00:00');
                const waitFromVisit = Math.floor((endDate.getTime() - snapVisitDate.getTime()) / 86400000);
                if (waitFromVisit >= 0) {
                  metricsData.sumWaitFromVisit += waitFromVisit;
                  metricsData.countWaitFromVisit++;
                }

                if (snap.decisionDate) {
                  const decisionDate = new Date(snap.decisionDate + 'T00:00:00');
                  const waitFromDecision = Math.floor((endDate.getTime() - decisionDate.getTime()) / 86400000);
                  if (waitFromDecision >= 0) {
                    metricsData.sumWaitFromDecision += waitFromDecision;
                    metricsData.countWaitFromDecision++;
                  }
                }
              } else if (snapVisitDate >= pFrom && snapVisitDate <= pTo) {
                prevMetricsData.totalDecidedCases++;
                prevMetricsData.completedOperations++;
              }
            }
          });
        }

        // 2. Process Active Pipeline
        if (prog && prog.visit) {
          const visitDate = new Date(prog.visit + 'T00:00:00');

          // Tally visits in current or previous period
          if (visitDate >= dFrom && visitDate <= dTo) {
            const vKey = `${dept.code}_${prog.visit}`;
            if (!countedVisits.has(vKey)) {
              metricsData.totalFirstVisits++;
              countedVisits.add(vKey);
            }
          } else if (visitDate >= pFrom && visitDate <= pTo) {
            const vKey = `PREV_${dept.code}_${prog.visit}`;
            if (!countedVisits.has(vKey)) {
              prevMetricsData.totalFirstVisits++;
              countedVisits.add(vKey);
            }
          }

          // Demographics for active pipeline
          if (!patientCountedForDemographics) {
            const gov = p.bas_gov || 'Unknown / Not Set';
            metricsData.demographics[gov] = (metricsData.demographics[gov] || 0) + 1;
            const gender = p.bas_gender || 'Unknown';
            metricsData.genders[gender] = (metricsData.genders[gender] || 0) + 1;
            patientCountedForDemographics = true;
          }

          const conditionRaw = prog.condition;
          if (conditionRaw) {
            let diagLabel = conditionRaw;
            if (conditionRaw === 'other' || conditionRaw === 'multiple') {
              diagLabel = prog.conditionOther || 'Other / Custom';
            } else {
              diagLabel = DIAGNOSIS_LABEL_MAP[conditionRaw] || conditionRaw;
            }
            metricsData.diagnoses[diagLabel] = (metricsData.diagnoses[diagLabel] || 0) + 1;
          }

          const isDecided = prog[`${pfx}OpReqAlarmActive`] === true || prog.isRebook === true;
          if (isDecided && prog.cancelType !== 'permanent') {
            metricsData.totalDecidedCases++;
            metricsData.currentlyWaiting++;

            const pri = prog[`${pfx}OpReqPriority`] || 'blue';
            if (pri === 'red') metricsData.acuity.red++;
            else if (pri === 'yellow') metricsData.acuity.yellow++;
            else metricsData.acuity.blue++;

            if (prog.acuityEscalated) metricsData.acuityEscalations++;

            const dest = prog.postDest || 'pending';
            if (dest !== 'pending') {
              metricsData.destinations[dest] = (metricsData.destinations[dest] || 0) + 1;
            }

            const bloodGate = prog.blood || 'not_needed';
            if (bloodGate !== 'not_needed' && !patientCountedForBlood) {
              metricsData.bloodNeeded++;
              const bType = p.bas_blood || 'Unknown';
              metricsData.bloodTypes[bType] = (metricsData.bloodTypes[bType] || 0) + 1;
              patientCountedForBlood = true;
            }

            // Check auto blockers list
            const blockedVals = ['pending', 'no', 'not_done', 'infected', 'impaired', 'signing_problem', 'abnormal'];
            Object.keys(prog).forEach(k => {
              if (['opStatus', 'enrolled', 'priority', 'orSlot', 'anesFeedback', 'journeyLog', 'visit', 'lastVisit'].includes(k)) return;
              const val = String(prog[k]).toLowerCase();
              if (val === 'not_needed' || val === 'not needed' || val === 'normal') return;

              if (blockedVals.some(bv => bv === 'no' ? val === 'no' : val.includes(bv)) || (k === 'postDest' && (val.includes('awaiting') || val === ''))) {
                const lbl = REPORT_LBL_MAP[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                metricsData.blockers[lbl] = (metricsData.blockers[lbl] || 0) + 1;
              }
            });

            // Check manual blockers
            [1, 2, 3].forEach(i => {
              if (prog[`${pfx}Blk${i}AlarmActive`] && prog[`${pfx}Blk${i}AlarmNote`]) {
                const note = prog[`${pfx}Blk${i}AlarmNote`];
                metricsData.blockers[`Manual: ${note}`] = (metricsData.blockers[`Manual: ${note}`] || 0) + 1;
              }
            });

            if (p.basSocAlarmActive) {
              metricsData.blockers['Global Social Issue'] = (metricsData.blockers['Global Social Issue'] || 0) + 1;
            }

            // Wait times in active pipeline
            const waitFromVisit = Math.floor((today.getTime() - visitDate.getTime()) / 86400000);
            if (waitFromVisit >= 0) {
              metricsData.sumWaitFromVisit += waitFromVisit;
              metricsData.countWaitFromVisit++;
            }

            const decisionDateStr = prog[`${pfx}OpReqAlarmDate`] || prog.originalDecisionDate;
            if (decisionDateStr) {
              const decisionDate = new Date(decisionDateStr + 'T00:00:00');
              const waitFromDecision = Math.floor((today.getTime() - decisionDate.getTime()) / 86400000);
              if (waitFromDecision >= 0) {
                metricsData.sumWaitFromDecision += waitFromDecision;
                metricsData.countWaitFromDecision++;
              }
            }
          }

          if (prog.cancelType) {
            if (prog.cancelType === 'permanent') metricsData.cancelTypes.permanent++;
            else metricsData.cancelTypes.reversible++;

            if (prog.cancelIsLate) metricsData.lateCancellations++;
            if (prog.cancelReason) {
              const reason = prog.cancelReason.trim();
              metricsData.cancelReasons[reason] = (metricsData.cancelReasons[reason] || 0) + 1;
            }
          }

          if (p.programs?.anes && p.programs.anes.assessmentStatus === 'unfit' && p.programs.anes.unfitReason) {
            if (prog.cancelType !== 'permanent') {
              const anesReason = p.programs.anes.unfitReason.trim();
              metricsData.anesRejects[anesReason] = (metricsData.anesRejects[anesReason] || 0) + 1;
            }
          }
        }
      });
    });

    const avgWaitVisit = metricsData.countWaitFromVisit > 0 ? Math.round(metricsData.sumWaitFromVisit / metricsData.countWaitFromVisit) : 0;
    const avgWaitDecision = metricsData.countWaitFromDecision > 0 ? Math.round(metricsData.sumWaitFromDecision / metricsData.countWaitFromDecision) : 0;
    const avgLOS = metricsData.countLOS > 0 ? Math.round(metricsData.sumLOS / metricsData.countLOS) : 0;

    setMetrics({
      totalFirstVisits: metricsData.totalFirstVisits,
      totalDecidedCases: metricsData.totalDecidedCases,
      currentlyWaiting: metricsData.currentlyWaiting,
      completedOperations: metricsData.completedOperations,
      avgWaitVisit,
      avgWaitDecision,
      avgLOS,
      acuity: metricsData.acuity,
      acuityEscalations: metricsData.acuityEscalations,
      demographics: metricsData.demographics,
      genders: metricsData.genders,
      diagnoses: metricsData.diagnoses,
      destinations: metricsData.destinations,
      bloodNeeded: metricsData.bloodNeeded,
      bloodTypes: metricsData.bloodTypes,
      blockers: metricsData.blockers,
      cancelReasons: metricsData.cancelReasons,
      cancelTypes: metricsData.cancelTypes,
      anesRejects: metricsData.anesRejects
    });

    setPrevMetrics({
      totalFirstVisits: prevMetricsData.totalFirstVisits,
      totalDecidedCases: prevMetricsData.totalDecidedCases,
      completedOperations: prevMetricsData.completedOperations
    });

  }, [dateFrom, dateTo, deptFilter, patients]);

  const handleExcelExport = () => {
    let deptName = "All Departments";
    if (deptFilter !== 'all') {
      const deptObj = DEPARTMENTS.find(d => d.code === deptFilter);
      if (deptObj) deptName = deptObj.label;
    }
    const fromFmt = dateFrom.split('-').reverse().join('-');
    const toFmt = dateTo.split('-').reverse().join('-');
    
    exportAnalyticsToExcel(
      metrics,
      metrics.avgWaitVisit,
      metrics.avgWaitDecision,
      metrics.avgLOS,
      deptName,
      fromFmt,
      toFmt
    );
  };

  const sortedDiagnoses = Object.entries(metrics.diagnoses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedBlockers = Object.entries(metrics.blockers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const conversionRate = metrics.totalFirstVisits > 0 ? Math.round((metrics.totalDecidedCases / metrics.totalFirstVisits) * 100) : 0;
  
  const totalAcuity = metrics.acuity.red + metrics.acuity.yellow + metrics.acuity.blue;
  const redPct = totalAcuity > 0 ? Math.round((metrics.acuity.red / totalAcuity) * 100) : 0;
  const yellowPct = totalAcuity > 0 ? Math.round((metrics.acuity.yellow / totalAcuity) * 100) : 0;
  const bluePct = totalAcuity > 0 ? Math.round((metrics.acuity.blue / totalAcuity) * 100) : 0;

  return (
    <div className="container fade-in">
      {/* ── BI Filters Bar ── */}
      <div className="filter-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label><Calendar className="w-3 h-3 inline mr-1" /> From Date</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)} 
            />
          </div>
          
          <div className="form-group" style={{ minWidth: 150 }}>
            <label><Calendar className="w-3 h-3 inline mr-1" /> To Date</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ minWidth: 180 }}>
            <label><Filter className="w-3 h-3 inline mr-1" /> Select Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">All Specialties</option>
              {DEPARTMENTS.filter(d => d.code !== 'anes').map(d => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleExcelExport}
          className="btn btn-primary" 
          style={{ height: 38, background: '#15803D', borderColor: '#15803D', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 0 }}
        >
          <Download className="w-4 h-4" />
          Export Executive Report
        </button>
      </div>

      {/* ── Pipeline summary widgets ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card all">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{metrics.totalFirstVisits}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center' }}>
              Total Visits <TrendBadge current={metrics.totalFirstVisits} previous={prevMetrics.totalFirstVisits} />
            </div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon" style={{ background: '#F0FDF4', color: '#15803D' }}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{metrics.totalDecidedCases}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center' }}>
              Decided Surgery <TrendBadge current={metrics.totalDecidedCases} previous={prevMetrics.totalDecidedCases} />
            </div>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{metrics.currentlyWaiting}</div>
            <div className="stat-label">Currently Waiting</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{metrics.completedOperations}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center' }}>
              Operations Completed <TrendBadge current={metrics.completedOperations} previous={prevMetrics.completedOperations} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #0D9488' }}>
          <div className="stat-icon" style={{ background: '#E6FFFA', color: '#0D9488' }}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{conversionRate}%</div>
            <div className="stat-label">Conversion Rate</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #6366F1' }}>
          <div className="stat-icon" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-value">{metrics.avgLOS} Days</div>
            <div className="stat-label">Avg Post-Op Stay</div>
          </div>
        </div>
      </div>

      {/* ── Funnel flow diagram summary ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '18px 24px', borderRadius: '16px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: 24, overflowX: 'auto', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 10px', borderRadius: '6px' }}>{metrics.totalFirstVisits}</span> Visits
        </div>
        <ArrowRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          <span style={{ background: '#F0FDF4', color: '#15803D', padding: '6px 10px', borderRadius: '6px' }}>{metrics.totalDecidedCases}</span> Decided
        </div>
        <ArrowRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          <span style={{ background: '#FFFBEB', color: '#D97706', padding: '6px 10px', borderRadius: '6px' }}>{metrics.currentlyWaiting}</span> Waiting
        </div>
        <ArrowRight className="text-slate-300 w-5 h-5 flex-shrink-0" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
          <span style={{ background: '#F3E8FF', color: '#9333EA', padding: '6px 10px', borderRadius: '6px' }}>{metrics.completedOperations}</span> Done
        </div>
      </div>

      {/* ── Details grids ── */}
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Panel 1: Wait Time Averages */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wait Time Averages</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>From First Visit</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{metrics.avgWaitVisit} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Days</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ color: '#E67E22', fontWeight: 700, fontSize: 13 }}>From Decision Date</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{metrics.avgWaitDecision} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Days</span></div>
            </div>
          </div>
        </div>

        {/* Panel 2: Acuity & Global Demographics */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acuity & Global Demographics</h3>
          <div>
            <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14, background: '#F1F5F9', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
              <div style={{ width: `${redPct}%`, background: '#DC2626', transition: 'width 0.5s ease' }}></div>
              <div style={{ width: `${yellowPct}%`, background: '#D97706', transition: 'width 0.5s ease' }}></div>
              <div style={{ width: `${bluePct}%`, background: '#2563EB', transition: 'width 0.5s ease' }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#DC2626', fontWeight: 700 }}>Urgent (Red)</span><span style={{ fontWeight: 700 }}>{redPct}% ({metrics.acuity.red})</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#D97706', fontWeight: 700 }}>Semi-Urgent (Yellow)</span><span style={{ fontWeight: 700 }}>{yellowPct}% ({metrics.acuity.yellow})</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: '#2563EB', fontWeight: 700 }}>Elective (Blue)</span><span style={{ fontWeight: 700 }}>{bluePct}% ({metrics.acuity.blue})</span></div>
            
            {metrics.acuityEscalations > 0 && (
              <div style={{ marginTop: 12, padding: 10, background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#991B1B' }}>
                ⚠️ {metrics.acuityEscalations} patient(s) clinically deteriorated (Priority escalated) while waiting.
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Governorates</h4>
                {Object.entries(metrics.demographics).length > 0 ? (
                  Object.entries(metrics.demographics)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([gov, val]) => (
                      <div key={gov} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{gov}</span>
                        <span style={{ fontWeight: 700 }}>{val}</span>
                      </div>
                    ))
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data.</div>
                )}
              </div>
              <div style={{ flex: 1, borderLeft: '1px dashed var(--border)', paddingLeft: 10 }}>
                <h4 style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Gender Split</h4>
                <div style={{ fontSize: 12, marginBottom: 2 }}>Male: <strong>{metrics.genders.male || 0}</strong></div>
                <div style={{ fontSize: 12 }}>Female: <strong>{metrics.genders.female || 0}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Clinical Diagnoses */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Diagnoses (Selected Dept)</h3>
          <div>
            {sortedDiagnoses.length > 0 ? (
              sortedDiagnoses.map(([diag, count]) => (
                <div key={diag} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                  <span style={{ color: 'var(--text-primary)', paddingRight: 10 }}>{diag}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 4 }}>
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No primary diagnoses recorded for this selection.</div>
            )}
          </div>
        </div>

        {/* Panel 4: Resource Demand forecasting */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resource Demand (Active Pipeline)</h3>
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Post-Op Bed Requirements</h4>
              {Object.entries(metrics.destinations).length > 0 ? (
                Object.entries(metrics.destinations)
                  .sort((a, b) => b[1] - a[1])
                  .map(([dest, count]) => {
                    const isIcu = dest.toLowerCase().includes('icu') || dest.toLowerCase().includes('picu');
                    return (
                      <div key={dest} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: isIcu ? '#DC2626' : 'var(--text-secondary)', fontWeight: isIcu ? '700' : 'normal' }}>
                          {dest.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 700 }}>{count} Patients</span>
                      </div>
                    );
                  })
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No destinations requested.</div>
              )}
            </div>
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Blood Bank Strain ({metrics.bloodNeeded} Total Patients)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {Object.entries(metrics.bloodTypes).length > 0 ? (
                  Object.entries(metrics.bloodTypes)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const isRare = type.includes('O') || type.includes('-');
                      return (
                        <span 
                          key={type}
                          style={{
                            background: isRare ? '#FEF2F2' : '#F8FAFC',
                            color: isRare ? '#DC2626' : '#475569',
                            border: `1px solid ${isRare ? '#FECACA' : '#E2E8F0'}`,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-block'
                          }}
                        >
                          {type}: {count}
                        </span>
                      );
                    })
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No blood products required.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Blockers and Attrition (Cancellations) ── */}
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 24 }}>
        
        {/* Bottom Left Panel: Bottlenecks & Blockers */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid #FECACA', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: '#DC2626', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Bottlenecks & Blockers</h3>
          <div>
            {sortedBlockers.length > 0 ? (
              sortedBlockers.map(([blocker, count]) => {
                const safeWaiting = metrics.currentlyWaiting > 0 ? metrics.currentlyWaiting : 1;
                const barWidth = Math.min(100, (count / safeWaiting) * 100);
                return (
                  <div key={blocker} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                      <span>{blocker}</span>
                      <span>{count}</span>
                    </div>
                    <div style={{ width: '100%', background: '#F1F5F9', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth}%`, background: '#EF4444', height: '100%', borderRadius: 4 }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No active blockers in the pipeline!</div>
            )}
          </div>
        </div>

        {/* Bottom Right Panel: Attrition: Holds, Cancellations & Rejections */}
        <div style={{ background: 'white', padding: 24, borderRadius: '16px', border: '1px solid #FCD34D', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 16, color: '#D97706', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attrition: Holds, Cancellations & Rejections</h3>
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#FFFBEB', padding: 10, borderRadius: 6, border: '1px dashed #FCD34D', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>{metrics.cancelTypes.reversible}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#B45309', fontWeight: 700 }}>Reversible Holds</div>
              </div>
              <div style={{ flex: 1, background: '#FEF2F2', padding: 10, borderRadius: 6, border: '1px dashed #FECACA', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{metrics.cancelTypes.permanent}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#991B1B', fontWeight: 700 }}>Permanent Cancels</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Surgeon Cancellation Reasons</h4>
                {Object.keys(metrics.cancelReasons).length > 0 ? (
                  <ul style={{ paddingLeft: 14, margin: 0 }}>
                    {Object.entries(metrics.cancelReasons)
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => (
                        <li key={reason} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: 3 }}>
                          {reason} <strong>({count})</strong>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 6 }}>None recorded.</div>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Anesthesia Reject Reasons</h4>
                {Object.keys(metrics.anesRejects).length > 0 ? (
                  <ul style={{ paddingLeft: 14, margin: 0 }}>
                    {Object.entries(metrics.anesRejects)
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => (
                        <li key={reason} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: 3 }}>
                          {reason} <strong>({count})</strong>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 6 }}>None recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
