import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ResearchTemplate, ResearchField, Patient } from '../../types';
import { exportResearchStudy } from '../../utils/excel';
import { Plus, Download, Trash2, X, PlusCircle, Database, BookOpen, Edit } from 'lucide-react';

export const ResearchHub: React.FC = () => {
  const { 
    researchTemplates, 
    saveResearchTemplate, 
    deleteResearchTemplate, 
    patients,
    setEditingPatientId
  } = useApp();

  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [showBuilder, setShowBuilder] = useState(false);
  
  // Builder state
  const [studyTitle, setStudyTitle] = useState('');
  const [fields, setFields] = useState<ResearchField[]>([]);

  const activeTemplates = Object.values(researchTemplates);
  const selectedStudy = researchTemplates[selectedStudyId];

  // Filter patients enrolled in the selected study
  const studyPatients = patients.filter(
    p => !p.isArchived && p.research && p.research[selectedStudyId]
  );

  const handleAddField = () => {
    setFields(prev => [...prev, { name: '', type: 'text', options: '' }]);
  };

  const handleFieldChange = (index: number, key: keyof ResearchField, value: any) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  };

  const handleRemoveField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyTitle.trim()) return alert('Please enter a study title.');
    if (fields.length === 0) return alert('Please add at least one data field.');

    const newTemplate: ResearchTemplate = {
      id: selectedStudy?.id || `study_${Date.now()}`,
      title: studyTitle.trim(),
      fields: fields.map(f => ({
        name: f.name.trim(),
        type: f.type,
        options: f.type === 'select' ? f.options : undefined
      }))
    };

    saveResearchTemplate(newTemplate);
    setSelectedStudyId(newTemplate.id);
    
    // Clear builder
    setStudyTitle('');
    setFields([]);
    setShowBuilder(false);
  };

  const handleOpenBuilderForCreate = () => {
    setStudyTitle('');
    setFields([{ name: 'Sample Variable Name', type: 'text' }]);
    setShowBuilder(true);
  };

  const handleExportExcel = () => {
    if (!selectedStudy) return;
    exportResearchStudy(selectedStudy, studyPatients);
  };

  const handleDeleteStudy = () => {
    if (window.confirm(`Are you sure you want to permanently delete the study template: "${selectedStudy.title}"?\n\nPatient records will retain their data, but the study definitions will be removed.`)) {
      deleteResearchTemplate(selectedStudy.id);
      setSelectedStudyId('');
    }
  };

  return (
    <div className="container fade-in">
      
      {/* ── Top Selection Row ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <Database className="w-5 h-5 text-teal-600" />
          <select 
            value={selectedStudyId} 
            onChange={(e) => setSelectedStudyId(e.target.value)}
            style={{ width: 'auto', minWidth: 220 }}
          >
            <option value="">-- Select Active Research Study --</option>
            {activeTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenBuilderForCreate}>
          <Plus className="w-4 h-4" />
          Create Research Study
        </button>
      </div>

      {/* ── Study Template View ── */}
      {selectedStudy ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Header Action Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: 16,
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudy.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Study ID: {selectedStudy.id} • {studyPatients.length} enrolled subjects
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleExportExcel}
                disabled={studyPatients.length === 0}
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={handleDeleteStudy}
              >
                <Trash2 className="w-4 h-4" />
                Delete Study
              </button>
            </div>
          </div>

          {/* Database Grid Table */}
          {studyPatients.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: 12 }}>Patient Name</th>
                    <th style={{ padding: 12 }}>MRN</th>
                    {selectedStudy.fields.map(f => (
                      <th key={f.name} style={{ padding: 12 }}>{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studyPatients.map(patient => (
                    <tr 
                      key={patient.id} 
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setEditingPatientId(patient.id)}
                      className="hover:bg-slate-50"
                    >
                      <td style={{ padding: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{patient.bas_name}</td>
                      <td style={{ padding: 12, fontFamily: 'var(--font-mono)' }}>{patient.bas_mrn}</td>
                      {selectedStudy.fields.map(f => (
                        <td key={f.name} style={{ padding: 12 }}>
                          {String(patient.research?.[selectedStudy.id]?.[f.name] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              border: '1.5px dashed var(--border)',
              borderRadius: 10
            }}>
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <h4>No Enrolled Patients in Study</h4>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                To record study details, open a patient registration file, enroll them under "Research Studies Data Entry", and fill their values.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3>Select a Research Study</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>Choose a medical study template above to view columns, entered clinical points, and spreadsheets.</p>
        </div>
      )}

      {/* ── Research Study Builder Modal ── */}
      {showBuilder && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: 620, textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Create Research Study Template</h3>
              <button onClick={() => setShowBuilder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div className="form-group">
                <label>Study Topic / Title</label>
                <input 
                  type="text" 
                  value={studyTitle} 
                  onChange={(e) => setStudyTitle(e.target.value)} 
                  placeholder="e.g. Spine Fusion Pulmonary Outcomes Study"
                  required
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>Variable Fields Checklist</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fields.map((field, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.2fr 2fr 30px',
                      gap: 8,
                      alignItems: 'end',
                      background: '#f8fafc',
                      padding: 10,
                      borderRadius: 8
                    }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 9 }}>Field / Parameter Name</label>
                        <input 
                          type="text" 
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Preop Cobb Angle"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 9 }}>Type</label>
                        <select 
                          value={field.type}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                        >
                          <option value="text">Text / Comment</option>
                          <option value="number">Numeric Measure</option>
                          <option value="select">Dropdown choices</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 9 }}>
                          {field.type === 'select' ? 'Options (comma-separated) *' : 'Dropdown options (N/A)'}
                        </label>
                        <input 
                          type="text" 
                          value={field.options || ''}
                          onChange={(e) => handleFieldChange(idx, 'options', e.target.value)}
                          placeholder="Titanium, Cobalt, Steel"
                          disabled={field.type !== 'select'}
                          required={field.type === 'select'}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveField(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', paddingBottom: 10 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddField}
                  style={{ marginTop: 14, width: '100%', borderStyle: 'dashed' }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Data Variable Field
                </button>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBuilder(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
