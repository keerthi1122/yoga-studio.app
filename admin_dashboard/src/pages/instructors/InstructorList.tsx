import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, X, Edit2, Power } from 'lucide-react';
import { Instructor } from '../../types';
import { 
  subscribeToInstructors, 
  createInstructor, 
  updateInstructor, 
  toggleInstructorActive 
} from '../../services/instructorService';

export const InstructorList: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSpecialties, setFormSpecialties] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToInstructors((liveList) => {
      setInstructors(liveList);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingInstructor(null);
    setFormName('');
    setFormBio('');
    setFormImage('');
    setFormSpecialties('');
    setIsModalOpen(true);
  };

  const openEditModal = (ins: Instructor) => {
    setEditingInstructor(ins);
    setFormName(ins.name);
    setFormBio(ins.bio);
    setFormImage(ins.profileImage);
    setFormSpecialties(ins.specialties.join(', '));
    setIsModalOpen(true);
  };

  const handleSaveInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    const specs = formSpecialties.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingInstructor) {
      try {
        await updateInstructor(editingInstructor.instructorId, {
          name: formName,
          bio: formBio,
          profileImage: formImage,
          specialties: specs,
        });
      } catch (_) {
        setInstructors(
          instructors.map((ins) =>
            ins.instructorId === editingInstructor.instructorId
              ? { ...ins, name: formName, bio: formBio, profileImage: formImage, specialties: specs }
              : ins
          )
        );
      }
    } else {
      const newInsData = {
        name: formName,
        bio: formBio,
        profileImage: formImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        specialties: specs,
        active: true,
      };

      try {
        await createInstructor(newInsData);
      } catch (_) {
        setInstructors([...instructors, { ...newInsData, instructorId: `ins_${Date.now()}` }]);
      }
    }
    setIsModalOpen(false);
  };

  const toggleStatus = async (ins: Instructor) => {
    try {
      await toggleInstructorActive(ins.instructorId, ins.active);
    } catch (_) {
      setInstructors(
        instructors.map((i) => (i.instructorId === ins.instructorId ? { ...i, active: !i.active } : i))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E9DCC5]/70">
        <div>
          <h1 className="font-serif text-3xl font-bold text-dark">Studio Instructors & Masters</h1>
          <p className="text-sm text-dark-muted mt-1">Manage teaching staff, specialty accreditations, and class allocations.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Instructor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {instructors.map((ins) => (
          <div
            key={ins.instructorId}
            className={`bg-white rounded-3xl p-6 border flex flex-col justify-between shadow-sm transition-all ${
              ins.active ? 'border-[#E9DCC5] hover:shadow-md' : 'border-zinc-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={ins.profileImage}
                  alt={ins.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-burgundy/20 shadow-sm"
                />
                <div>
                  <h3 className="font-serif text-lg font-bold text-dark">{ins.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        ins.active
                          ? 'text-sage-dark bg-sage-50 border-sage/30'
                          : 'text-zinc-600 bg-zinc-100 border-zinc-300'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      {ins.active ? 'Active Resident Teacher' : 'Inactive / On Leave'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-dark-muted leading-relaxed mb-4">{ins.bio}</p>

              <div>
                <span className="text-[10px] uppercase font-bold text-dark-muted tracking-wider block mb-2">Specialties:</span>
                <div className="flex flex-wrap gap-1.5">
                  {ins.specialties.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-cream text-dark text-[11px] font-medium border border-beige">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E9DCC5]/70 flex items-center justify-between">
              <button
                onClick={() => toggleStatus(ins)}
                className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                  ins.active ? 'text-zinc-500 hover:text-red-700' : 'text-emerald-700 hover:underline'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{ins.active ? 'Deactivate' : 'Activate'}</span>
              </button>

              <button
                onClick={() => openEditModal(ins)}
                className="text-xs font-semibold text-burgundy hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Onboard / Edit Instructor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E9DCC5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5]">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editingInstructor ? 'Edit Instructor Profile' : 'Onboard New Instructor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-cream text-dark-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInstructor} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Master Liam Thorne"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Bio & Accreditations</label>
                <textarea
                  required
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Teaching background, RYT certifications, and mindfulness focus..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase mb-1">Specialties (Comma Separated)</label>
                <input
                  type="text"
                  value={formSpecialties}
                  onChange={(e) => setFormSpecialties(e.target.value)}
                  placeholder="Vinyasa, Sound Bath, Pranayama"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E9DCC5] bg-cream/20 text-xs focus:outline-none focus:border-burgundy"
                />
              </div>

              <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9DCC5] text-xs font-semibold text-dark-muted hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-xl text-xs font-semibold shadow-md shadow-burgundy/20"
                >
                  {editingInstructor ? 'Update Profile' : 'Save & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
