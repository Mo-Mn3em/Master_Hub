// Dynamic department custom forms and gates configurations from legacy master-hub.
// This is converted to a TypeScript module.

export interface Department {
  code: string;
  label: string;
  color: string;
  pfx?: string;
  customForm?: string;
  customGates?: string;
}

const DEPARTMENTS = [
            { code: 'anes', label: 'Anesthesia Clinic', color: '#8E44AD' },
            { code: 'spin', label: 'Spinal Surgery', color: '#E67E22', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="spin_visit"></div><div class="form-group"><label>Primary Diagnosis</label>
			  <select id="spin_condition" class="form-select">
				<option value="" disabled selected>Select Condition</option>
				<optgroup label="Deformity">
					<option value="scoliosis_early">Idiopathic Scoliosis - Early Onset</option>
					<option value="scoliosis_adolescent">Idiopathic Scoliosis - Adolescent</option>
					<option value="scoliosis_congenital">Congenital Scoliosis</option>
					<option value="scoliosis_neuromuscular">Neuromuscular Scoliosis</option>
					<option value="scoliosis_syndromic">Syndromic Scoliosis</option>
					<option value="kyphosis">Kyphosis - Congenital / Scheuermann's</option>
				</optgroup>
				<optgroup label="Congenital & Dysraphism">
					<option value="spina_bifida">Spina Bifida / MMC</option>
					<option value="tethered_cord">Tethered Cord Syndrome</option>
					<option value="diastematomyelia">Diastematomyelia</option>
					<option value="hemivertebra">Hemivertebra</option>
					<option value="sacral_agenesis">Sacral Agenesis / Caudal Regression</option>
					<option value="klippel_feil">Klippel-Feil Syndrome</option>
				</optgroup>
				<optgroup label="Trauma & Instability">
					<option value="spondylolysis">Spondylolysis / Spondylolisthesis</option>
					<option value="spine_trauma">Pediatric Spine Fracture / Trauma</option>
					<option value="atlantoaxial_instability">Atlantoaxial Instability</option>
				</optgroup>
				<optgroup label="Infection & Oncology">
					<option value="spine_tumor_bone">Spinal Tumor - Bone / Primary</option>
					<option value="spine_tumor_neural">Intraspinal / Neural Tumor</option>
					<option value="spondylodiscitis">Spondylodiscitis / Osteomyelitis</option>
				</optgroup>
				<optgroup label="Other">
					<option value="other">Other / Unlisted Diagnosis</option>
				</optgroup>
			</select>
			  </div><div class="form-group"><label>Decision for Surgery</label><select id="spin_opDecided"><option value="no">Not Yet</option><option value="yes">Yes — Decided</option></select></div></div>
              
              <div id="spin_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #E67E22;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #E67E22;">Specify Other Diagnosis *</label>
                      <input type="text" id="spin_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`,
              customGates: `<div class="gate-item"><label>🖥️ 3D CT Done?</label><select id="spin_ctDone"><option value="pending">— Pending —</option><option value="yes">✓ Done / Yes</option><option value="no">✗ Not Done / No</option></select></div><div class="gate-item"><label>🧠 MRI Present?</label><select id="spin_mriPresent"><option value="no">— No —</option><option value="yes">✓ Yes</option></select></div><div class="gate-item"><label>❤️ Final Preop ECHO</label><select id="spin_echoDone"><option value="pending">⏳ Pending</option><option value="done">✓ Done</option><option value="not_needed">Not needed</option></select></div><div class="gate-item"><label>🔩 Hardware/Implant Available?</label><select id="spin_hardware"><option value="pending">⏳ Pending</option><option value="ordered">Ordered</option><option value="available">✓ Available</option></select></div><div class="gate-item"><label>📡 Intraop Neuro Monitoring?</label><select id="spin_neuroMonitor"><option value="not_needed">Not Needed</option><option value="pending">Pending</option><option value="confirmed">✓ Confirmed</option></select></div>` 
            },
            { code: 'hopb', label: 'HOPBE Program', color: '#1ABC9C', pfx: 'hop', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="hop_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="hop_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Exstrophy-Epispadias Complex">
                    <option value="classic_exstrophy">Classic Bladder Exstrophy</option>
                    <option value="cloacal_exstrophy">Cloacal Exstrophy</option>
                    <option value="epispadias_male">Epispadias (Male)</option>
                    <option value="epispadias_female">Epispadias (Female)</option>
                    <option value="exstrophy_variant">Exstrophy Variant / Pseudoexstrophy</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div></div>
              
              <div id="hop_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #1ABC9C;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #1ABC9C;">Specify Other Diagnosis *</label>
                      <input type="text" id="hop_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`,
			  customGates: `<div class="gate-item"><label>🦴 Osteotomy Status</label><select id="hop_osteotomy"><option value="not_needed">Not Needed</option><option value="pending">⏳ Required & Pending Ortho Consult</option><option value="notified">✓ Required & Ortho Notified</option></select></div>`
			  },
            { code: 'hi', label: 'Cardiac Congenital', color: '#E74C3C', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="hi_visit"></div><div class="form-group"><label>Primary Diagnosis</label>
			  <select id="hi_condition" class="form-select">
					<option value="" disabled selected>Select Condition</option>
					
					<optgroup label="Acyanotic & Shunt Defects">
						<option value="vsd">Ventricular Septal Defect (VSD)</option>
						<option value="asd">Atrial Septal Defect (ASD)</option>
						<option value="pda">Patent Ductus Arteriosus (PDA)</option>
						<option value="avsd">Atrioventricular Septal Defect (AVSD)</option>
						<option value="ap_window">Aortopulmonary (AP) Window</option>
						<option value="cor_triatriatum">Cor Triatriatum</option>
					</optgroup>
					
					<optgroup label="Cyanotic & Single Ventricle">
						<option value="tof">Tetralogy of Fallot (TOF)</option>
						<option value="tga">Transposition of the Great Arteries (TGA / ccTGA)</option>
						<option value="truncus">Truncus Arteriosus</option>
						<option value="tapvr">Total Anomalous Pulm. Venous Return (TAPVR)</option>
						<option value="tricuspid_atresia">Tricuspid Atresia</option>
						<option value="pulmonary_atresia">Pulmonary Atresia (PA / MAPCAs)</option>
						<option value="hlhs">Hypoplastic Left Heart Syndrome (HLHS)</option>
						<option value="dorv">Double Outlet Right Ventricle (DORV)</option>
						<option value="ebstein">Ebstein Anomaly</option>
						<option value="heterotaxy">Heterotaxy / Isomerism Syndromes</option>
					</optgroup>
					
					<optgroup label="Obstructive & Arch Anomalies">
						<option value="coa">Coarctation of the Aorta (CoA)</option>
						<option value="iaa">Interrupted Aortic Arch (IAA)</option>
						<option value="aortic_stenosis">Aortic Stenosis (AS)</option>
						<option value="pulmonary_stenosis">Pulmonary Stenosis (PS)</option>
						<option value="shones">Shone's Complex</option>
						<option value="vascular_ring">Vascular Rings / Pulmonary Slings</option>
					</optgroup>
					
					<optgroup label="Valvular, Coronary & Myocardial">
						<option value="alcapa">ALCAPA / Coronary Anomalies</option>
						<option value="congenital_mitral">Congenital Mitral / Tricuspid Valve Disease</option>
						<option value="cardiomyopathy">Cardiomyopathy / Heart Failure</option>
						<option value="rheumatic">Rheumatic Heart Disease (RHD)</option>
						<option value="kawasaki">Kawasaki Disease (Coronary Aneurysm)</option>
					</optgroup>
					
					<optgroup label="Electrophysiology & Other">
						<option value="arrhythmia">Arrhythmia / Congenital Heart Block</option>
						<option value="other">Other / Unlisted Diagnosis</option>
					</optgroup>
				</select>
			  </div><div class="form-group"><label>Intervention Category</label><select id="hi_interventionType"><option value="open_heart">Open Heart Surgery</option><option value="cath">Cardiac Catheterization</option></select></div></div>
              
              <div id="hi_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #E74C3C;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #E74C3C;">Specify Other Diagnosis *</label>
                      <input type="text" id="hi_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`,
              customGates: `<div class="gate-item"><label>🩸 Blood Group</label><input type="text" id="hi_bloodGroup" disabled style="background:rgba(0,0,0,0.05); font-weight:bold; border-color:transparent; color: var(--text-primary);" placeholder="⏳ Awaiting Demographics"></div><div class="gate-item"><label>❤️ Final Preop ECHO</label><select id="hi_echoRecent"><option value="pending">⏳ Pending</option><option value="done">✓ Done</option><option value="not_needed">Not needed</option></select></div><div class="gate-item"><label>🖥️ Cardiac CT / MRI?</label><select id="hi_ctMri"><option value="pending">Pending</option><option value="not_needed">Not needed</option><option value="done">✓ Done</option></select></div><div class="gate-item"><label>🫀 Perfusionist Confirmed?</label><select id="hi_perfusionist"><option value="not_needed">Not Needed</option><option value="no">— No —</option><option value="yes">✓ Yes</option></select></div>`
            },
            { code: 'cprp', label: 'Colorectal & Pelvic', color: '#9B59B6', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="cprp_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="cprp_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Anorectal Malformations (ARM)">
                    <option value="arm_low">Low ARM (e.g., Perineal / Vestibular Fistula)</option>
                    <option value="arm_high">High / Intermediate ARM (Rectourethral / Prostatic)</option>
                    <option value="arm_without_fistula">Imperforate Anus (Without Fistula)</option>
                    <option value="cloaca">Cloacal Malformation</option>
                </optgroup>
                <optgroup label="Hirschsprung & Motility">
                    <option value="hirschsprung">Hirschsprung Disease (HD)</option>
                    <option value="tca">Total Colonic Aganglionosis (TCA)</option>
                    <option value="motility_disorder">Intestinal Motility Disorder / IND</option>
                </optgroup>
                <optgroup label="Exstrophy-Epispadias Complex">
                    <option value="bladder_exstrophy">Classic Bladder Exstrophy</option>
                    <option value="cloacal_exstrophy">Cloacal Exstrophy (OEIS)</option>
                    <option value="epispadias">Epispadias (Male / Female)</option>
                </optgroup>
                <optgroup label="Urogenital & Gynecological">
                    <option value="urogenital_sinus">Urogenital Sinus (UGS)</option>
                    <option value="dsd_cah">DSD / Congenital Adrenal Hyperplasia (CAH)</option>
                    <option value="vaginal_agenesis">Vaginal Agenesis / MRKH</option>
                    <option value="hydrocolpos">Hydrocolpos / Vaginal Atresia</option>
                    <option value="ovarian_mass">Ovarian Cyst / Tumor</option>
                </optgroup>
                <optgroup label="Urinary Tract & Urachal">
                    <option value="neurogenic_bladder">Neurogenic Bladder</option>
                    <option value="patent_urachus">Patent Urachus / Urachal Cyst</option>
                </optgroup>
                <optgroup label="Functional & Acquired">
                    <option value="rectal_prolapse">Rectal Prolapse</option>
                    <option value="rectal_polyp">Rectal Polyp</option>
                    <option value="fecal_incontinence">Severe Constipation / Fecal Incontinence</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="colostomy_closure">Status Post Colostomy (For Closure)</option>
                    <option value="redo_surgery">Complications / Redo Surgery</option>
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div><div class="form-group"><label>Continence Status</label><select id="cprp_continence"><option value="">— Select —</option><option value="normal">Normal Continence</option><option value="impaired">Impaired / Soiling</option><option value="incontinent">Totally Incontinent</option><option value="stoma">Stoma Dependent</option></select></div></div>
              
              <div id="cprp_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #9B59B6;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #8E44AD;">Specify Other Diagnosis *</label>
                      <input type="text" id="cprp_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'orth', label: 'Orthopedic Surgery', color: '#2ECC71', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="orth_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="orth_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Neuromuscular & Syndromic">
                    <option value="cp">Cerebral Palsy (CP)</option>
                    <option value="spina_bifida">Spina Bifida / MMC</option>
                    <option value="amc">Arthrogryposis (AMC)</option>
                    <option value="oi">Osteogenesis Imperfecta (OI)</option>
                    <option value="muscular_dystrophy">Muscular Dystrophy</option>
                </optgroup>
                <optgroup label="Hip & Pelvis">
                    <option value="ddh">Developmental Dysplasia of the Hip (DDH)</option>
                    <option value="perthes">Legg-Calve-Perthes Disease</option>
                    <option value="scfe">Slipped Capital Femoral Epiphysis (SCFE)</option>
                    <option value="coxa_vara">Coxa Vara</option>
                </optgroup>
                <optgroup label="Foot & Ankle">
                    <option value="clubfoot">Clubfoot (CTEV)</option>
                    <option value="flatfoot">Pes Planovalgus (Flatfoot)</option>
                    <option value="cavus">Pes Cavovarus (Cavus Foot)</option>
                    <option value="cvt">Congenital Vertical Talus (CVT)</option>
                    <option value="tarsal_coalition">Tarsal Coalition</option>
                    <option value="metatarsus_adductus">Metatarsus Adductus</option>
                </optgroup>
                <optgroup label="Lower Limb & Angular">
                    <option value="genu_varum">Genu Varum / Blount's Disease</option>
                    <option value="genu_valgum">Genu Valgum (Knock Knees)</option>
                    <option value="cpt">Congenital Pseudarthrosis of Tibia</option>
                    <option value="hemimelia">Fibular / Tibial Hemimelia</option>
                    <option value="pffd">Proximal Focal Femoral Deficiency (PFFD)</option>
                    <option value="lld">Leg Length Discrepancy (LLD)</option>
                </optgroup>
                <optgroup label="Upper Extremity & Hand">
                    <option value="polydactyly">Polydactyly / Syndactyly</option>
                    <option value="radial_club_hand">Radial / Ulnar Club Hand</option>
                    <option value="trigger_thumb">Trigger Thumb / Finger</option>
                    <option value="amniotic_band">Amniotic Band Syndrome</option>
                    <option value="erbs_palsy">Brachial Plexus Birth Palsy</option>
                </optgroup>
                <optgroup label="Trauma, Infection & Tumors">
                    <option value="fracture">Fracture / Malunion / Non-union</option>
                    <option value="infection">Osteomyelitis / Septic Arthritis</option>
                    <option value="bone_cyst">Bone Cyst (UBC / ABC)</option>
                    <option value="osteochondroma">Osteochondroma / MHE</option>
                    <option value="tumor_malignant">Malignant Bone Tumor</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Condition</option>
                </optgroup>
              </select></div><div class="form-group"><label>Limb / Side Affected</label><select id="orth_limbAffected">
                <option value="">— Select Area —</option>
                <optgroup label="Single Limb">
                    <option value="right_upper">Right Upper Limb</option>
                    <option value="left_upper">Left Upper Limb</option>
                    <option value="right_lower">Right Lower Limb</option>
                    <option value="left_lower">Left Lower Limb</option>
                </optgroup>
                <optgroup label="Bilateral & Multi-Limb">
                    <option value="bilateral_upper">Bilateral Upper Limbs</option>
                    <option value="bilateral_lower">Bilateral Lower Limbs</option>
                    <option value="right_hemi">Right Half (Upper & Lower)</option>
                    <option value="left_hemi">Left Half (Upper & Lower)</option>
                    <option value="quad">All 4 Limbs / Quadriplegic</option>
                </optgroup>
                <optgroup label="Axial & Other">
                    <option value="spine">Spine</option>
                    <option value="pelvis">Pelvis / Hip</option>
                    <option value="multiple">Multiple / Complex (Specify)</option>
                </optgroup>
              </select></div></div>
              
              <div id="orth_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #2ECC71;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: var(--info);">Specify Other Condition *</label>
                      <input type="text" id="orth_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>
              
              <div id="orth_otherLimbWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #9B59B6; background-color: #F5EEF8;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #8E44AD;">Specify Complex Limb Involvement *</label>
                      <input type="text" id="orth_limbOther" placeholder="e.g., Bilateral lower limbs + Right upper limb...">
                  </div>
              </div>`,
			  customGates: `<div class="gate-item"><label>🖥️ X-Ray / CT Done?</label><select id="orth_xrayCt"><option value="pending">⏳ Pending</option><option value="done">✓ Done</option><option value="not_needed">Not Needed</option></select></div><div class="gate-item"><label>🔩 Implant/Hardware Available?</label><select id="orth_hardware"><option value="pending">⏳ Pending</option><option value="available">✓ Available</option><option value="not_needed">Not Needed</option></select></div>`
            },
            { code: 'neur', label: 'Neurosurgery', color: '#3498DB', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="neur_visit"></div><div class="form-group"><label>Primary Diagnosis</label>
			  <select id="neur_condition" class="form-select">
					<option value="" disabled selected>Select Condition</option>
					<optgroup label="Hydrocephalus & CSF">
						<option value="hydrocephalus_congenital">Congenital Hydrocephalus</option>
						<option value="hydrocephalus_post">Post-Hemorrhagic / Post-Infectious Hydrocephalus</option>
						<option value="arachnoid_cyst">Arachnoid Cyst</option>
						<option value="dandy_walker">Dandy-Walker Malformation</option>
					</optgroup>
					<optgroup label="Congenital & Dysraphism">
						<option value="encephalocele">Encephalocele</option>
						<option value="chiari">Chiari Malformation (Type I / II)</option>
						<option value="craniosynostosis">Craniosynostosis (Single / Multi-suture)</option>
						<option value="spina_bifida">Spina Bifida / MMC</option>
					</optgroup>
					<optgroup label="Tumors & Vascular">
						<option value="brain_tumor">Brain Tumor (Medulloblastoma, Astrocytoma, etc.)</option>
						<option value="vogm">Vein of Galen Malformation (VOGM)</option>
						<option value="moyamoya">Moyamoya Disease</option>
						<option value="avm">AVM / Vascular Malformation</option>
					</optgroup>
					<optgroup label="Functional & Trauma">
						<option value="epilepsy_surg">Epilepsy (Surgical Candidate)</option>
						<option value="spasticity">Spasticity (SDR / Baclofen Pump)</option>
						<option value="tbi_skull_fx">Pediatric TBI / Skull Fracture</option>
					</optgroup>
					<optgroup label="Other">
						<option value="other">Other / Unlisted Diagnosis</option>
					</optgroup>
				</select>
			  </div></div>
              <div id="neur_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #3498DB;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #3498DB;">Specify Other Diagnosis *</label>
                      <input type="text" id="neur_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'urol', label: 'Urology Surgery', color: '#F39C12', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="urol_visit"></div><div class="form-group"><label>Primary Diagnosis</label>
			  <select id="urol_condition" class="form-select">
					<option value="" disabled selected>Select Condition</option>
					
					<optgroup label="Kidneys & Upper Tract">
						<option value="hydronephrosis_pujo">Hydronephrosis / PUJO</option>
						<option value="megaureter">UVJ Obstruction / Megaureter</option>
						<option value="ureterocele">Ureterocele / Ectopic Ureter</option>
						<option value="mcdk">Multicystic Dysplastic Kidney (MCDK)</option>
					</optgroup>
					
					<optgroup label="Bladder & Lower Tract">
						<option value="vur">Vesicoureteral Reflux (VUR)</option>
						<option value="puv">Posterior Urethral Valves (PUV)</option>
						<option value="neurogenic_bladder">Neurogenic Bladder</option>
						<option value="bladder_exstrophy">Bladder Exstrophy / Epispadias</option>
						<option value="urachal">Urachal Anomaly</option>
						<option value="prune_belly">Prune Belly Syndrome</option>
					</optgroup>
					
					<optgroup label="Genital & Scrotal">
						<option value="hypospadias">Hypospadias / Chordee</option>
						<option value="cryptorchidism">Undescended Testis (Cryptorchidism)</option>
						<option value="dsd">Disorders of Sex Development (DSD)</option>
						<option value="hydrocele_varicocele">Hydrocele / Varicocele / Torsion</option>
					</optgroup>
					
					<optgroup label="Tumors & Other">
						<option value="wilms_tumor">Wilms Tumor / Renal Mass</option>
						<option value="rhabdomyosarcoma">Rhabdomyosarcoma (Genitourinary)</option>
						<option value="other">Other / Unlisted Diagnosis</option>
					</optgroup>
				</select>
			  </div></div>
              <div id="urol_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #F39C12;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #F39C12;">Specify Other Diagnosis *</label>
                      <input type="text" id="urol_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'ent', label: 'ENT & Airway', color: '#1ABC9C', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="ent_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="ent_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Airway Anomalies">
                    <option value="subglottic_stenosis">Subglottic Stenosis</option>
                    <option value="laryngomalacia">Laryngomalacia</option>
                    <option value="tracheomalacia">Tracheomalacia</option>
                    <option value="choanal_atresia">Choanal Atresia</option>
                    <option value="laryngeal_web">Laryngeal Web</option>
                    <option value="laryngeal_cleft">Laryngeal Cleft (Types 1-4)</option>
                    <option value="vocal_cord_paralysis">Congenital Vocal Cord Paralysis</option>
                </optgroup>
                <optgroup label="Ear & Hearing">
                    <option value="microtia">Microtia / Aural Atresia</option>
                    <option value="otitis_media">Chronic Otitis Media / Effusion</option>
                    <option value="cholesteatoma">Cholesteatoma</option>
                </optgroup>
                <optgroup label="Head & Neck Masses">
                    <option value="branchial_cleft">Branchial Cleft Cyst / Sinus</option>
                    <option value="thyroglossal">Thyroglossal Duct Cyst</option>
                    <option value="cystic_hygroma">Cystic Hygroma / Lymphangioma</option>
                </optgroup>
                <optgroup label="Pharyngeal & Oral">
                    <option value="adenotonsillar">Adenotonsillar Hypertrophy</option>
                    <option value="tongue_tie">Ankyloglossia (Tongue Tie)</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div><div class="form-group"><label>Tracheostomy Status</label><select id="ent_trachStatus"><option value="none">None</option><option value="in_situ">In Situ</option><option value="decannulated">Decannulated</option></select></div></div>
              
              <div id="ent_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #1ABC9C;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #1ABC9C;">Specify Other Diagnosis *</label>
                      <input type="text" id="ent_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'gps', label: 'General Pediatric Surgery', color: '#E67E22', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="gps_visit"></div><div class="form-group"><label>Primary Diagnosis</label>
			  <select id="gps_condition" class="form-select">
				<option value="" disabled selected>Select Condition</option>
				
				<optgroup label="Neonatal & Gastrointestinal">
					<option value="duodenal_atresia">Duodenal Atresia / Web</option>
					<option value="jejunoileal_atresia">Jejunoileal Atresia</option>
					<option value="nec">Necrotizing Enterocolitis (NEC)</option>
					<option value="pyloric_stenosis">Hypertrophic Pyloric Stenosis</option>
					<option value="malrotation">Malrotation / Midgut Volvulus</option>
					<option value="intussusception">Intussusception</option>
					<option value="meckels">Meckel's Diverticulum</option>
					<option value="appendicitis">Appendicitis</option>
				</optgroup>
				
				<optgroup label="Thoracic (Non-Cardiac) & Foregut">
					<option value="ea_tef">Esophageal Atresia (EA) / TEF</option>
					<option value="cdh">Congenital Diaphragmatic Hernia (CDH)</option>
					<option value="cpam_bps">CPAM / Bronchopulmonary Sequestration</option>
					<option value="pectus">Pectus Excavatum / Carinatum</option>
				</optgroup>
				
				<optgroup label="Abdominal Wall Defects">
					<option value="gastroschisis">Gastroschisis</option>
					<option value="omphalocele">Omphalocele</option>
					<option value="inguinal_hernia">Inguinal Hernia / Hydrocele</option>
					<option value="umbilical_hernia">Umbilical / Epigastric Hernia</option>
				</optgroup>
				
				<optgroup label="Head, Neck & Skin">
					<option value="thyroglossal">Thyroglossal Duct Cyst</option>
					<option value="branchial_cleft">Branchial Cleft Anomaly</option>
					<option value="lymphangioma">Lymphangioma / Cystic Hygroma</option>
				</optgroup>
				
				<optgroup label="Pediatric Solid Tumors">
					<option value="neuroblastoma">Neuroblastoma</option>
					<option value="wilms">Wilms Tumor (Nephroblastoma)</option>
					<option value="hepatoblastoma">Hepatoblastoma</option>
					<option value="sct">Sacrococcygeal Teratoma (SCT)</option>
				</optgroup>
				
				<optgroup label="Other">
					<option value="other">Other / Unlisted Diagnosis</option>
				</optgroup>
			</select>
			  
			  </div></div>
              
              <div id="gps_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #E67E22;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #E67E22;">Specify Other Diagnosis *</label>
                      <input type="text" id="gps_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'maxf', label: 'Maxillofacial Surgery', color: '#8E44AD', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="maxf_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="maxf_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Clefts">
                    <option value="cleft_lip">Cleft Lip (Unilateral / Bilateral)</option>
                    <option value="cleft_palate">Cleft Palate</option>
                    <option value="submucous_cleft">Submucous Cleft Palate</option>
                </optgroup>
                <optgroup label="Syndromes & Sequences">
                    <option value="pierre_robin">Pierre Robin Sequence</option>
                    <option value="treacher_collins">Treacher Collins Syndrome</option>
                    <option value="hemifacial_microsomia">Hemifacial Microsomia</option>
                </optgroup>
                <optgroup label="Vascular Anomalies">
                    <option value="hemangioma">Hemangioma</option>
                    <option value="vascular_malformation">Vascular / Arteriovenous Malformation</option>
                    <option value="lymphangioma">Lymphangioma / Cystic Hygroma</option>
                </optgroup>
                <optgroup label="Craniofacial & Pathological">
                    <option value="craniosynostosis">Craniosynostosis (Syndromic/Non-syndromic)</option>
                    <option value="facial_trauma">Facial Trauma / Fracture</option>
                    <option value="jaw_tumor">Mandibular / Maxillary Cyst or Tumor</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div></div>
              
              <div id="maxf_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #8E44AD;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #8E44AD;">Specify Other Diagnosis *</label>
                      <input type="text" id="maxf_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'recon', label: 'Reconstructive Surgery', color: '#E91E63', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="recon_visit"></div><div class="form-group"><label>Primary Condition</label><select id="recon_condition">
                <option value="">— Select Condition —</option>
                <optgroup label="Burn & Scar">
                    <option value="post_burn_contracture">Post-Burn Contracture</option>
                    <option value="keloid_hypertrophic">Keloid / Hypertrophic Scar</option>
                    <option value="acute_burn">Acute Burn Injury</option>
                </optgroup>
                <optgroup label="Congenital Anomalies">
                    <option value="vascular_anomaly">Vascular Anomaly / Hemangioma</option>
                    <option value="congenital_nevus">Giant Congenital Nevus</option>
                    <option value="ear_anomaly">Microtia / Prominent Ear</option>
                </optgroup>
                <optgroup label="Trauma & Soft Tissue">
                    <option value="soft_tissue_loss">Soft Tissue Defect / Loss</option>
                    <option value="facial_trauma">Facial Trauma Reconstruction</option>
                    <option value="nerve_injury">Peripheral Nerve Injury</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Condition</option>
                </optgroup>
              </select></div></div>
              
              <div id="recon_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #E91E63;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #E91E63;">Specify Other Condition *</label>
                      <input type="text" id="recon_conditionOther" placeholder="Type the exact condition here...">
                  </div>
              </div>`
            },
            { code: 'abci', label: 'ABCI (Cochlear Implant)', color: '#34495E', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="abci_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="abci_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Sensorineural Hearing Loss (SNHL)">
                    <option value="snhl_bilateral_profound">Bilateral Profound SNHL</option>
                    <option value="snhl_bilateral_severe">Bilateral Severe SNHL</option>
                    <option value="snhl_unilateral">Unilateral SNHL</option>
                </optgroup>
                <optgroup label="Auditory & Anatomy">
                    <option value="auditory_neuropathy">Auditory Neuropathy Spectrum</option>
                    <option value="cochlear_anomaly">Congenital Cochlear Anomaly</option>
                    <option value="post_meningitis">Post-Meningitis Ossification</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div></div>
              
              <div id="abci_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #34495E;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #34495E;">Specify Other Diagnosis *</label>
                      <input type="text" id="abci_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'hope', label: 'Hope Start (Prenatal)', color: '#F1C40F', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>Prenatal Consult Date</label><input type="date" id="hope_visit"></div><div class="form-group"><label>Fetal Diagnosis</label><select id="hope_condition">
                <option value="">— Select Fetal Diagnosis —</option>
                <optgroup label="Central Nervous System">
                    <option value="fetal_mmc">Fetal Myelomeningocele (MMC)</option>
                    <option value="fetal_hydrocephalus">Fetal Hydrocephalus</option>
                    <option value="fetal_encephalocele">Encephalocele</option>
                </optgroup>
                <optgroup label="Thoracic & Airway">
                    <option value="fetal_cdh">Congenital Diaphragmatic Hernia (CDH)</option>
                    <option value="fetal_cpam">CPAM / BPS (Lung Lesion)</option>
                    <option value="fetal_chaost">CHAOS (Airway Obstruction)</option>
                    <option value="fetal_neck_mass">Fetal Neck Mass (EXIT Candidate)</option>
                </optgroup>
                <optgroup label="Abdominal & GI">
                    <option value="fetal_gastroschisis">Gastroschisis</option>
                    <option value="fetal_omphalocele">Omphalocele</option>
                    <option value="fetal_bowel_atresia">Bowel Atresia</option>
                </optgroup>
                <optgroup label="Genitourinary & Tumors">
                    <option value="fetal_luto">Lower Urinary Tract Obstruction (LUTO)</option>
                    <option value="fetal_sct">Sacrococcygeal Teratoma (SCT)</option>
                </optgroup>
                <optgroup label="Multiple Gestation">
                    <option value="fetal_ttts">TTTS / TRAP Sequence</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other Fetal Anomaly</option>
                </optgroup>
              </select></div><div class="form-group"><label>Gestational Age at Consult (Weeks)</label><input type="number" id="hope_gestationalAge" placeholder="e.g., 24" min="0"></div></div>
              
              <div id="hope_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #F1C40F;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #D4AC0D;">Specify Other Fetal Diagnosis *</label>
                      <input type="text" id="hope_conditionOther" placeholder="Type the exact fetal diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'hypo', label: 'Hypospadias Clinic', color: '#16A085', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="hypo_visit"></div><div class="form-group"><label>Hypospadias Type</label><select id="hypo_condition">
                <option value="">— Select Type —</option>
                <optgroup label="Distal (Anterior)">
                    <option value="glanular">Glanular</option>
                    <option value="coronal">Coronal</option>
                    <option value="subcoronal">Subcoronal</option>
                </optgroup>
                <optgroup label="Midshaft (Middle)">
                    <option value="distal_penile">Distal Penile</option>
                    <option value="midshaft">Midshaft</option>
                    <option value="proximal_penile">Proximal Penile</option>
                </optgroup>
                <optgroup label="Proximal (Posterior)">
                    <option value="penoscrotal">Penoscrotal</option>
                    <option value="scrotal">Scrotal</option>
                    <option value="perineal">Perineal</option>
                </optgroup>
                <optgroup label="Complications & Other">
                    <option value="fistula">Urethrocutaneous Fistula (Post-op)</option>
                    <option value="stricture">Urethral Stricture / Stenosis</option>
                    <option value="chordee_only">Chordee Without Hypospadias</option>
                    <option value="other">Other / Complex Redo</option>
                </optgroup>
              </select></div></div>
              
              <div id="hypo_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #16A085;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #16A085;">Specify Other Type/Complication *</label>
                      <input type="text" id="hypo_conditionOther" placeholder="Type details here...">
                  </div>
              </div>`
            },
            { code: 'sbif', label: 'Spina Bifida Clinic', color: '#2980B9', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="sbif_visit"></div><div class="form-group"><label>Primary Lesion Level</label><select id="sbif_condition">
                <option value="">— Select Level —</option>
                <optgroup label="Lesion Level">
                    <option value="cervical">Cervical</option>
                    <option value="thoracic">Thoracic</option>
                    <option value="lumbar">Lumbar</option>
                    <option value="sacral">Sacral</option>
                </optgroup>
                <optgroup label="Other Diagnostics">
                    <option value="lipomeningocele">Lipomeningocele (Closed Defect)</option>
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div><div class="form-group"><label>Shunt Status</label><select id="sbif_shunt"><option value="none">No Shunt</option><option value="vp_shunt">VP Shunt Present</option><option value="etv">ETV Done</option></select></div></div>
              
              <div id="sbif_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #2980B9;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #2980B9;">Specify Other Diagnosis *</label>
                      <input type="text" id="sbif_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'ndev', label: 'Neurodevelopmental', color: '#8E44AD', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="ndev_visit"></div><div class="form-group"><label>Primary Condition</label><select id="ndev_condition">
                <option value="">— Select Condition —</option>
                <optgroup label="Developmental & Behavioral">
                    <option value="asd">Autism Spectrum Disorder (ASD)</option>
                    <option value="adhd">ADHD</option>
                    <option value="global_delay">Global Developmental Delay (GDD)</option>
                    <option value="intellectual_disability">Intellectual Disability</option>
                </optgroup>
                <optgroup label="Motor & Neurological">
                    <option value="cerebral_palsy">Cerebral Palsy (CP)</option>
                    <option value="hypotonia">Central Hypotonia</option>
                    <option value="genetic_syndrome">Genetic / Chromosomal Syndrome</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Condition</option>
                </optgroup>
              </select></div></div>
              
              <div id="ndev_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #8E44AD;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #8E44AD;">Specify Other Condition *</label>
                      <input type="text" id="ndev_conditionOther" placeholder="Type the exact condition here...">
                  </div>
              </div>`
            },
            { code: 'livt', label: 'Liver Transplant', color: '#D35400', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="livt_visit"></div><div class="form-group"><label>Primary Diagnosis</label><select id="livt_condition">
                <option value="">— Select Diagnosis —</option>
                <optgroup label="Cholestatic & Biliary">
                    <option value="biliary_atresia">Biliary Atresia</option>
                    <option value="pfi_cholestasis">PFIC</option>
                    <option value="alagille">Alagille Syndrome</option>
                </optgroup>
                <optgroup label="Metabolic & Genetic">
                    <option value="wilson">Wilson Disease</option>
                    <option value="alpha1">Alpha-1 Antitrypsin Deficiency</option>
                    <option value="glycogen_storage">Glycogen Storage Disease</option>
                </optgroup>
                <optgroup label="Hepatic Tumors">
                    <option value="hepatoblastoma">Hepatoblastoma</option>
                    <option value="hcc">Hepatocellular Carcinoma (HCC)</option>
                </optgroup>
                <optgroup label="Failure & Other">
                    <option value="alf">Acute Liver Failure (ALF)</option>
                    <option value="cirrhosis">End-Stage Liver Disease / Cirrhosis</option>
                    <option value="other">Other / Unlisted Diagnosis</option>
                </optgroup>
              </select></div></div>
              
              <div id="livt_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #D35400;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #D35400;">Specify Other Diagnosis *</label>
                      <input type="text" id="livt_conditionOther" placeholder="Type the exact diagnosis here...">
                  </div>
              </div>`
            },
            { code: 'dent', label: 'Dental & Maxillofacial', color: '#7F8C8D', 
              customForm: `<div class="form-grid three"><div class="form-group"><label>First Clinic Visit</label><input type="date" id="dent_visit"></div><div class="form-group"><label>Primary Condition</label><select id="dent_condition">
                <option value="">— Select Condition —</option>
                <optgroup label="Restorative & Caries">
                    <option value="early_childhood_caries">Early Childhood Caries (ECC)</option>
                    <option value="rampant_caries">Rampant Caries</option>
                    <option value="pulpitis">Irreversible Pulpitis</option>
                </optgroup>
                <optgroup label="Special Care & Syndromic">
                    <option value="special_needs_dental">Special Needs Dentistry (ASD/CP)</option>
                    <option value="cleft_dental">Cleft Lip/Palate Dental Care</option>
                    <option value="amelogenesis">Amelogenesis / Dentinogenesis Imperfecta</option>
                </optgroup>
                <optgroup label="Surgical & Trauma">
                    <option value="dental_trauma">Dental Trauma / Avulsion</option>
                    <option value="supernumerary">Supernumerary / Impacted Teeth</option>
                    <option value="abscess">Dental Abscess / Cellulitis</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="other">Other / Unlisted Condition</option>
                </optgroup>
              </select></div></div>
              
              <div id="dent_otherConditionWrapper" class="conditional-section hidden" style="margin-top: 0.5rem; border-left-color: #7F8C8D;">
                  <div class="form-group" style="margin-bottom: 0;">
                      <label style="color: #7F8C8D;">Specify Other Condition *</label>
                      <input type="text" id="dent_conditionOther" placeholder="Type the exact condition here...">
                  </div>
              </div>`
            }
        ];

export default DEPARTMENTS;
