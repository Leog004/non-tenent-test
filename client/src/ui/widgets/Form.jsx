import React from "react";

export default function Form({ fields = [], submit, ctx }) {
  const [values, setValues] = React.useState(
    Object.fromEntries(fields.map((f) => [f.name, ""]))
  );
  function set(name, val) {
    setValues((v) => ({ ...v, [name]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const [method, url] = submit.url.split(":", 2);
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      credentials: "include",
    });
    if (!r.ok) {
      alert("Error: " + (await r.text()));
      return;
    }
    alert("Created");
    ctx?.refresh?.()            
  }

  return (
    <form onSubmit={onSubmit}>
      {fields.map((f) => (
        <div key={f.name} style={{ marginBottom: 8 }}>
          <label>
            <div>{f.label}</div>
            {f.component === "Select" ? (
              <select
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.component === "Number" ? "number" : "text"}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </label>
        </div>
      ))}
      <button type="submit">{submit.label || "Submit"}</button>
    </form>
  );
}
