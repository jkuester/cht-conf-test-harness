require('./cht-environment');

const FormWireupApp = require('./form-host-app');
const FormWireupContact = require('./form-host-contact');
const FormFiller = require('./form-filler');

/* Register global hook so new forms can be rendered from Puppeteer */
window.loadForm = (formName, formType, formHtml, formModel, formXml, content, userSettingsDoc, contactSummary) => {
  const wireupType = formType === 'contact' ? FormWireupContact : FormWireupApp;
  return loadForm(wireupType, formName, formHtml, formModel, formXml, content, userSettingsDoc, contactSummary);
};

const loadForm = async (FormWireup, formName, formHtml, formModel, formXml, content, userSettingsDoc, contactSummary) => {
  const wireup = new FormWireup(formHtml, formModel, formXml, userSettingsDoc, contactSummary);
  const form = await wireup.render(content);
  const formFiller = new FormFiller(form, { verbose: true });

  window.form = form;
  window.formFiller = formFiller;

  const untransformedFillAndSave = async (multipageAnswer) => {
    const { isComplete, errors } = await formFiller.fillForm(multipageAnswer);
    if (!isComplete) {
      return {
        errors,
        section: 'general',
        result: [],
      };
    }

    try {
      return {
        errors: [],
        section: 'general',
        result: await wireup.save(formName, form),
      };
    }
    catch (e) {
      return { 
        errors: [
          {
            type: 'save',
            msg: `Failed to save app form: ${e}`,
          },
          ...await formFiller.getVisibleValidationErrors(),
        ],
        section: 'general',
        result: [],
      };
    }
  };

  window.fillAndSave = async multipageAnswer => wireup.transformResult(await untransformedFillAndSave(multipageAnswer));
  window.unload = () => wireup.unload(form);
};
