function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;;
        }
    }
    var selectorRules = {}
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
        var errorMessage;

        var rules = selectorRules[rule.selector]

        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        document.querySelector(rule.selector + ':checked')
                    )
                    break;
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            if (errorMessage) break;
        }
        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }
        return !errorMessage;
    }
    var formElement = document.querySelector(options.form);
    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();
            var isFormValid = true;
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement, rule)
                if (!isValid) {
                    isFormValid = false;
                }
            });
            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not([disable])')
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                                if (input.checked) {
                                    values[input.name] = input.value
                                }
                                if (!values[input.name]) {
                                    values[input.name] = ''
                                }
                                break;
                            case 'checkbox':
                                if (input.checked) {
                                    if (Array.isArray(values[input.name])) {
                                        values[input.name].push(input.value)
                                    } else {
                                        values[input.name] = [input.value]
                                    }
                                }
                                if (!values[input.name]) {
                                    values[input.name] = ''
                                }
                                break;
                            case 'file':
                                values[input.name] = input.files
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {})
                    options.onSubmit(formValues);
                }
                else {
                    formElement.submit()
                }
            }
        }
        options.rules.forEach(function (rule) {

            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }
            var inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach(function (inputElement) {
                var parentElementInput = getParent(inputElement, options.formGroupSelector);
                inputElement.onblur = function () {
                    validate(inputElement, rule)
                }
                inputElement.oninput = function () {
                    var errorElement = parentElementInput.querySelector(options.errorSelector)
                    errorElement.innerText = '';
                    parentElementInput.classList.remove('invalid')
                }
                inputElement.onchange = function () {
                    var errorElement = parentElementInput.querySelector(options.errorSelector)
                    errorElement.innerText = '';
                    parentElementInput.classList.remove('invalid')
                }
            })
        })
    }
}

Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này.'
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là Email.'
        }
    }
}

Validator.minLength = function (selector, min,) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự.`
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị không khớp.'
        }
    }
}
