import axios from 'axios';

const locale = process.argv[2] || 'hu_HU';
const language = process.argv[3] || locale.split('_')[0] || 'hu';

const url = `https://apis.justwatch.com/content/providers/locale/${locale}?language=${language}`;

try {
  const res = await axios.get(url);
  const providers = Array.isArray(res.data) ? res.data : [];
  const filtered = providers.filter((provider) => {
    const name = `${provider.clear_name || ''} ${provider.short_name || ''}`.toLowerCase();
    return name.includes('prime') || name.includes('amazon') || name.includes('skyshowtime');
  });

  console.log(`Providers for ${locale} (${language})`);
  filtered.forEach((provider) => {
    console.log(`${provider.clear_name} -> short_name=${provider.short_name}`);
  });
} catch (error) {
  console.error('Failed to fetch providers:', error.message);
  if (error.response?.data) {
    console.error(error.response.data);
  }
  process.exit(1);
}
