import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Instagram, ExternalLink, User, Mail, Hash, Building2, Users } from 'lucide-react';

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
    const [instagramVisited, setInstagramVisited] = useState(false);
    const [instagramFollowed, setInstagramFollowed] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
                const val = formData[q.id];

                // Required check
                if (q.required) {
                    if (!val || (Array.isArray(val) && val.length === 0)) {
                        newErrors[q.id] = 'This field is required';
                    }
                }

                // Specific validation for Mobile/Phone
                if (val && (q.label.toLowerCase().includes('mobile') || q.label.toLowerCase().includes('phone') || q.label.toLowerCase().includes('contact'))) {
                    if (val.length !== 10) {
                        newErrors[q.id] = 'Must be exactly 10 digits';
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

    const handleChange = (e, question = null) => {
        let { name, value, type } = e.target;

        // Custom sanitization logic
        if (question) {
            const labelLower = question.label.toLowerCase();

            // Mobile/Phone: Digits only, max 10
            if (labelLower.includes('mobile') || labelLower.includes('phone') || labelLower.includes('contact')) {
                value = value.replace(/\D/g, '').slice(0, 10);
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50 rounded-xl border border-[var(--accent)]/30">
                <CheckCircle size={60} color="var(--accent)" className="mb-4" />
                <h3 className="text-2xl font-bold text-main mb-2">Registered!</h3>
                <p className="text-zinc-400 mb-4">
                    You have successfully registered for <span className="text-main font-medium">{event.title}</span>.
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
                icon={User}
            />
            <InputField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="john@example.com"
                icon={Mail}
            />

            {/* Dynamic Questions (if any) */}
            {event.questions && event.questions.length > 0 ? (
                event.questions.map((q) => {
                    if (q.type === 'text') {
                        const isPhone = q.label.toLowerCase().includes('mobile') || q.label.toLowerCase().includes('phone');
                        return (
                            <InputField
                                key={q.id}
                                label={q.label}
                                name={q.id}
                                value={formData[q.id] || ''}
                                onChange={(e) => handleChange(e, q)}
                                error={errors[q.id]}
                                placeholder={isPhone ? "1234567890" : "Your answer"}
                                inputMode={isPhone ? "numeric" : "text"}
                                type={isPhone ? "tel" : "text"}
                                maxLength={isPhone ? 10 : undefined}
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
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-main transition-colors">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt}
                                                onChange={handleChange}
                                                checked={formData[q.id] === opt}
                                                className="accent-[var(--accent)]"
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
                                            <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-main transition-colors">
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
                                                    className="accent-[var(--accent)]"
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
                            icon={Hash}
                        />
                        <InputField
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            error={errors.department}
                            placeholder="CS / IT"
                            icon={Building2}
                        />
                    </div>

                    <InputField
                        label="Team Name (Optional)"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="e.g. Code Warriors"
                        icon={Users}
                    />
                </>
            )}

            <div className="mb-8 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <h3 className="text-main text-lg mb-4 flex items-center gap-2">
                    <Instagram color="#E1306C" size={20} /> Required Verification
                </h3>
                <p className="text-zinc-400 text-sm mb-6">
                    To register, you must follow us on Instagram <strong>@gcetloop</strong>.
                </p>

                <div className="flex flex-col gap-4">
                    <a
                        href="https://www.instagram.com/gcetloop"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setInstagramVisited(true)}
                        className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-main rounded-lg font-bold text-sm hover:opacity-90 transition-opacity no-underline"
                    >
                        <ExternalLink size={16} /> Visit @gcetloop on Instagram
                    </a>

                    <label className={`flex items-center gap-3 transition-opacity ${instagramVisited ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'}`}>
                        <input
                            type="checkbox"
                            checked={instagramFollowed}
                            onChange={(e) => setInstagramVisited && setInstagramFollowed(e.target.checked)}
                            disabled={!instagramVisited}
                            className="w-5 h-5 accent-[var(--accent)]"
                        />
                        <span className="text-zinc-300 text-sm">
                            I have successfully followed LOOP on Instagram.
                        </span>
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || !instagramFollowed}
                className={`
                    w-full py-3 mt-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all
                    ${(isSubmitting || !instagramFollowed)
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-[var(--accent)] text-black hover:shadow-[0_0_15px_rgba(0, 243, 255,0.4)] hover:-translate-y-0.5 cursor-pointer'}
                `}
            >
                {isSubmitting ? 'Processing...' : 'CONFIRM REGISTRATION'}
            </button>
        </form>
    );
};

const InputField = ({ label, name, type = "text", value, onChange, error, placeholder, icon: Icon, inputMode, maxLength }) => (
    <div className="w-full">
        <label className="block mb-2 text-zinc-400 text-sm font-medium">
            {label}
        </label>
        <div className="relative group">
            {Icon && (
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${error ? 'text-[#ff0055]' : 'text-zinc-500 group-focus-within:text-[var(--accent)]'}`}>
                    <Icon size={18} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                inputMode={inputMode}
                maxLength={maxLength}
                className={`
                    w-full bg-zinc-100 border rounded-xl p-3 text-black placeholder:text-zinc-500 outline-none transition-all duration-300
                    ${Icon ? 'pl-11' : 'pl-4'}
                    ${error
                        ? 'border-[#ff0055] focus:shadow-[0_0_20px_rgba(255,0,85,0.2)]'
                        : 'border-zinc-800 focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_0_20px_rgba(0, 243, 255,0.1)]'}
                `}
            />
            {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff0055]">
                    <AlertCircle size={18} />
                </div>
            )}
        </div>
        {error && (
            <p className="text-[#ff0055] text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
            </p>
        )}
    </div>
);

export default RegistrationForm;
