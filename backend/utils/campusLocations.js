const CAMPUS_LOCATIONS = [
  {
    id: 'library',
    name: 'Learning Resource Center',
    aliases: ['Campus Library', 'CTU Library'],
    zone: 'central',
    safetyScore: 0.97,
    coordinates: { lat: 10.03215, lng: 105.76831 },
    description: 'Central Learning Resource Center zone inside CTU Campus II.',
  },
  {
    id: 'student-center',
    name: 'Student Support Center',
    aliases: ['Student Center', 'Student Services'],
    zone: 'central',
    safetyScore: 0.95,
    coordinates: { lat: 10.03076, lng: 105.76962 },
    description: 'Student support area near the Văn phòng Đoàn - Hội office.',
  },
  {
    id: 'gate-a',
    name: 'Gate A - 3/2 Street',
    aliases: ['Campus Gate A', 'Gate A'],
    zone: 'north',
    safetyScore: 0.88,
    coordinates: { lat: 10.03198, lng: 105.76978 },
    description: 'Main gate and guard post area facing 3/2 Street.',
  },
  {
    id: 'cafeteria',
    name: 'Student Cafeteria',
    aliases: ['Cafeteria', 'Campus Cafeteria'],
    zone: 'west',
    safetyScore: 0.9,
    coordinates: { lat: 10.03256, lng: 105.76646 },
    description: 'Campus canteen area near the technology faculty courtyard.',
  },
  {
    id: 'sports-ground',
    name: 'Sports Complex Courtyard',
    aliases: ['Sports Ground', 'Sports Complex'],
    zone: 'south',
    safetyScore: 0.82,
    coordinates: { lat: 10.03336, lng: 105.76916 },
    description: 'Sports complex and multi-purpose gym entrance area.',
  },
];

const CAMPUS_CENTER = { lat: 10.03215, lng: 105.76831 };

const findCampusLocation = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  return (
    CAMPUS_LOCATIONS.find(
      (item) =>
        item.id.toLowerCase() === normalized ||
        item.name.toLowerCase() === normalized ||
        (item.aliases || []).some((alias) => alias.toLowerCase() === normalized)
    ) || null
  );
};

module.exports = {
  CAMPUS_CENTER,
  CAMPUS_LOCATIONS,
  findCampusLocation,
};
