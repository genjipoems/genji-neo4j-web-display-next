'use client';

import MultiSelectDropdown from './MultiSelectDropdown.prod.jsx';

export default function AddresseeDropdown({ value, onChange, allowedKeys = null, allPoems = [] }) {
  const addresseeItems = Array.from(
    new Set(allPoems.map((p) => p.addressee_name).filter(Boolean))
  )
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ key: name, label: name }));

  return (
    <MultiSelectDropdown
      items={addresseeItems}
      value={value}
      onChange={onChange}
      allowedKeys={allowedKeys}
      placeholder="Select Addressees"
    />
  );
}