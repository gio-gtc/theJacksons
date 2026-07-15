(function () {
    const form = document.getElementById("signup-form");
    const success = document.getElementById("signup-success");

    if (!form || !success) {
        return;
    }

    const fields = [
        {
            input: form.elements.namedItem("firstName"),
            errorId: "first-name-error",
            message: "First name is required.",
        },
        {
            input: form.elements.namedItem("lastName"),
            errorId: "last-name-error",
            message: "Last name is required.",
        },
        {
            input: form.elements.namedItem("email"),
            errorId: "email-error",
            message: "A valid email is required.",
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
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
            syncFilledState(field.input);
        });
        field.input.addEventListener("blur", () => {
            field.input.classList.remove("is-focused");
            syncFilledState(field.input);
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const results = fields.map(validateField);
        const isValid = results.every(Boolean);

        if (!isValid) {
            const firstInvalid = fields.find((field, index) => !results[index] && field.input);
            firstInvalid?.input.focus();
            return;
        }

        const payload = {
            firstName: String(form.elements.namedItem("firstName").value).trim(),
            lastName: String(form.elements.namedItem("lastName").value).trim(),
            email: String(form.elements.namedItem("email").value).trim(),
            updates: true,
        };

        console.log(payload);

        form.hidden = true;
        success.hidden = false;
    });
})();
