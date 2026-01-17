import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle } from 'lucide-react';

const RegistrationForm = ({ event, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        enrollmentId: '',
        department: '',
        teamName: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Legacy Validation only if no custom questions
        if (!event.questions || event.questions.length === 0) {
            if (!formData.enrollmentId?.trim()) newErrors.enrollmentId = 'ID is required';
            if (!formData.department?.trim()) newErrors.department = 'Department is required';
        }
        // Dynamic Validation
        else {
            event.questions.forEach(q => {
                if (q.required) {
                    const val = formData[q.id];
                    if (!val || (Array.isArray(val) && val.length === 0)) {
                        newErrors[q.id] = 'This field is required';
                    }
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const registrationData = {
                eventId: event.id,
                eventTitle: event.title,
                name: formData.name,
                email: formData.email,
                createdAt: new Date(),
                // Save legacy fields if they exist, else N/A
                enrollmentId: formData.enrollmentId || 'N/A',
                department: formData.department || 'N/A',
                teamName: formData.teamName || '',
                // Save dynamic responses properly
                responses: event.questions ? event.questions.map(q => ({
                    question: q.label,
                    answer: formData[q.id] || (q.type === 'checkbox' ? [] : '')
                })) : []
            };

            await addDoc(collection(db, "registrations"), registrationData);
            setIsSubmitting(false);
            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error registering: ", error);
            alert("Registration failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50 rounded-xl border border-[var(--neon-green)]/30">
                <CheckCircle size={60} color="var(--neon-green)" className="mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Registered!</h3>
                <p className="text-zinc-400 mb-4">
                    You have successfully registered for <span className="text-white font-medium">{event.title}</span>.
                </p>
                <p className="text-sm text-zinc-500">
                    A confirmation email has been sent to {formData.email}.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Base Fields usually needed for everything */}
            <InputField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="John Doe"
            />
            <InputField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="john@example.com"
            />

            {/* Dynamic Questions (if any) */}
            {event.questions && event.questions.length > 0 ? (
                event.questions.map((q) => {
                    if (q.type === 'text') {
                        return (
                            <InputField
                                key={q.id}
                                label={q.label}
                                name={q.id}
                                value={formData[q.id] || ''}
                                onChange={handleChange}
                                error={errors[q.id]}
                                placeholder="Your answer"
                            />
                        );
                    }
                    if (q.type === 'radio') {
                        return (
                            <div key={q.id} className="mb-4">
                                <label className="block mb-2 text-zinc-400 text-sm">
                                    {q.label} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex flex-col gap-2">
                                    {q.options.map((opt, idx) => (
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt}
                                                onChange={handleChange}
                                                checked={formData[q.id] === opt}
                                                className="accent-[var(--neon-cyan)]"
                                            />
                                            <span className="text-sm text-zinc-300">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors[q.id] && <p className="text-[#ff0055] text-xs mt-1">{errors[q.id]}</p>}
                            </div>
                        );
                    }
                    if (q.type === 'checkbox') {
                        return (
                            <div key={q.id} className="mb-4">
                                <label className="block mb-2 text-zinc-400 text-sm">
                                    {q.label} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex flex-col gap-2">
                                    {q.options.map((opt, idx) => {
                                        const checked = (formData[q.id] || []).includes(opt);
                                        return (
                                            <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name={q.id}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const current = formData[q.id] || [];
                                                        const newVals = checked
                                                            ? current.filter(v => v !== val)
                                                            : [...current, val];
                                                        setFormData(prev => ({ ...prev, [q.id]: newVals }));
                                                    }}
                                                    checked={checked}
                                                    className="accent-[var(--neon-cyan)]"
                                                />
                                                <span className="text-sm text-zinc-300">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {errors[q.id] && <p className="text-[#ff0055] text-xs mt-1">{errors[q.id]}</p>}
                            </div>
                        );
                    }
                    return null;
                })
            ) : (
                /* Default Static Fields if no dynamic questions */
                <>
                    <div className="flex flex-col md:flex-row gap-4">
                        <InputField
                            label="Enrollment ID"
                            name="enrollmentId"
                            value={formData.enrollmentId}
                            onChange={handleChange}
                            error={errors.enrollmentId}
                            placeholder="123456"
                        />
                        <InputField
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            error={errors.department}
                            placeholder="CS / IT"
                        />
                    </div>

                    <InputField
                        label="Team Name (Optional)"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="e.g. Code Warriors"
                    />
                </>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className={`
                    w-full py-3 mt-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all
                    ${isSubmitting
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-[var(--neon-cyan)] text-black hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:-translate-y-0.5 cursor-pointer'}
                `}
            >
                {isSubmitting ? 'Processing...' : 'CONFIRM REGISTRATION'}
            </button>
        </form>
    );
};

const InputField = ({ label, name, type = "text", value, onChange, error, placeholder }) => (
    <div className="w-full">
        <label className="block mb-2 text-zinc-400 text-sm">
            {label}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
                    w-full bg-white/5 border rounded-lg p-3 text-white outline-none transition-all
                    ${error ? 'border-[#ff0055]' : 'border-zinc-700 focus:border-[var(--neon-cyan)]'}
                `}
            />
            {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff0055]">
                    <AlertCircle size={18} />
                </div>
            )}
        </div>
        {error && (
            <p className="text-[#ff0055] text-xs mt-1">{error}</p>
        )}
    </div>
);

export default RegistrationForm;
