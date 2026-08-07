'use client';

import MultiSelectDropdown from './MultiSelectDropdown.prod.jsx';

export default function SpeakerDropdown({ value, onChange, allowedKeys = null, allPoems = [] }) {
  const speakerItems = Array.from(
    new Set(allPoems.map((p) => p.speaker_name).filter(Boolean))
  )
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ key: name, label: name }));

  return (
    <MultiSelectDropdown
      items={speakerItems}
      value={value}
      onChange={onChange}
      allowedKeys={allowedKeys}
      placeholder="Select Speakers"
    />
  );
}