(function () {
    const form = document.getElementById("signup-form");
    const success = document.getElementById("signup-success");
    const phoneInput = document.getElementById("phone");

    if (!form || !success || !phoneInput || typeof window.intlTelInput !== "function") {
        return;
    }

    const iti = window.intlTelInput(phoneInput, {
        onlyCountries: ["ie", "gb"],
        initialCountry: "ie",
        countryOrder: ["ie", "gb"],
        separateDialCode: false,
        numberDisplayFormat: "NATIONAL",
        formatAsYouType: false,
        strictMode: false,
        countrySearch: false,
        placeholderNumberPolicy: "OFF",
    });

    // Patterns: IE `12 123 4567` | UK `12 3456 7891`
    const MASKS = {
        ie: { max: 9, groups: [2, 3, 4] },
        gb: { max: 10, groups: [2, 4, 4] },
    };

    function getIso2() {
        // v29 API: getSelectedCountry() (not getSelectedCountryData)
        const iso2 = String(iti.getSelectedCountry()?.iso2 || "ie").toLowerCase();
        return iso2 === "gb" ? "gb" : "ie";
    }

    function formatPhone(value, iso2) {
        const { max, groups } = MASKS[iso2];
        let digits = String(value || "").replace(/\D/g, "");
        if (digits.startsWith("0")) {
            digits = digits.slice(1);
        }
        digits = digits.slice(0, max);

        const parts = [];
        let i = 0;
        for (const size of groups) {
            if (i >= digits.length) {
                break;
            }
            parts.push(digits.slice(i, i + size));
            i += size;
        }
        return parts.join(" ");
    }

    function applyPhoneMask() {
        const iso2 = getIso2();
        const previous = phoneInput.value;
        const caretDigits = String(previous)
            .slice(0, phoneInput.selectionStart || 0)
            .replace(/\D/g, "").length;
        const formatted = formatPhone(previous, iso2);

        if (formatted === previous) {
            syncFilledState(phoneInput);
            return;
        }

        phoneInput.value = formatted;

        let seen = 0;
        let caret = formatted.length;
        for (let i = 0; i < formatted.length; i += 1) {
            if (/\d/.test(formatted[i])) {
                seen += 1;
                if (seen === caretDigits) {
                    caret = i + 1;
                    break;
                }
            }
        }
        phoneInput.setSelectionRange(caret, caret);
        syncFilledState(phoneInput);
    }

    const fields = [
        {
            input: form.elements.namedItem("first_name"),
            errorId: "first-name-error",
            message: "First name is required.",
        },
        {
            input: form.elements.namedItem("last_name"),
            errorId: "last-name-error",
            message: "Last name is required.",
        },
        {
            input: phoneInput,
            errorId: "phone-error",
            message: "A valid phone number is required.",
            validate: () => iti.isValidNumber(),
        },
        {
            input: form.elements.namedItem("updates"),
            errorId: "updates-error",
            message: "Please opt in to continue.",
            isCheckbox: true,
        },
    ];

    function setError(field, message) {
        const errorEl = document.getElementById(field.errorId);
        if (!errorEl || !field.input) {
            return;
        }

        if (message) {
            errorEl.textContent = message;
            errorEl.hidden = false;
            field.input.classList.add("field__input--invalid");
            field.input.setAttribute("aria-invalid", "true");
        } else {
            errorEl.textContent = "";
            errorEl.hidden = true;
            field.input.classList.remove("field__input--invalid");
            field.input.removeAttribute("aria-invalid");
        }
    }

    function validateField(field) {
        const input = field.input;
        if (!input) {
            return false;
        }

        if (field.isCheckbox) {
            const ok = input.checked;
            setError(field, ok ? "" : field.message);
            return ok;
        }

        const value = String(input.value || "").trim();
        if (!value) {
            setError(field, field.message);
            return false;
        }

        if (field.validate && !field.validate(value)) {
            setError(field, field.message);
            return false;
        }

        setError(field, "");
        return true;
    }

    function syncFilledState(input) {
        if (!input || input.type === "checkbox") {
            return;
        }
        input.classList.toggle("is-filled", String(input.value || "").trim().length > 0);
    }

    fields.forEach((field) => {
        if (!field.input || field.isCheckbox) {
            return;
        }

        syncFilledState(field.input);
        field.input.addEventListener("focus", () => {
            field.input.classList.add("is-focused");
        });
        field.input.addEventListener("input", () => {
            if (field.input === phoneInput) {
                applyPhoneMask();
            } else {
                syncFilledState(field.input);
            }

            if (field.input.getAttribute("aria-invalid") === "true") {
                validateField(field);
            }
        });
        field.input.addEventListener("blur", () => {
            field.input.classList.remove("is-focused");
            if (field.input === phoneInput) {
                applyPhoneMask();
            } else {
                syncFilledState(field.input);
            }
        });
    });

    phoneInput.addEventListener("countrychange", () => {
        applyPhoneMask();
        if (phoneInput.getAttribute("aria-invalid") === "true") {
            validateField(fields.find((field) => field.input === phoneInput));
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        applyPhoneMask();
    
        const results = fields.map(validateField);
        if (!results.every(Boolean)) {
            fields.find((field, index) => !results[index] && field.input)?.input.focus();
            return;
        }
    
        const formData = new FormData(form);
        formData.set("phone", iti.getNumber());
        formData.set("updates", 1);
        formData.set("source", "ireland.jacksons.live");
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;
        }

        fetch("https://www.YOUR-OTHER-SITE.com/receiver.php", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json(); 
        })
        .then(data => {
            form.hidden = true;
            success.hidden = false;
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong saving your information. Please try again.");
            
            if (submitBtn) {
                submitBtn.textContent = "Sign Up";
                submitBtn.disabled = false;
            }
        });
    });
})();
