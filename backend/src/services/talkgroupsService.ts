import https from 'https';
import pool from '../config/database';

// Country code to full country name mapping
const COUNTRY_NAMES: { [key: string]: string } = {
  'WW': 'Worldwide',
  'Global': 'Global',
  'XX': 'Other',
  'Unknown': 'Unknown',
  'EU': 'Europe',
  'NA_REGION': 'North America',
  'SA_REGION': 'South America',
  'AF_REGION': 'Africa',
  'AS': 'Asia',
  'OC': 'Oceania',
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IE': 'Ireland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'IS': 'Iceland',
  'AL': 'Albania',
  'MK': 'North Macedonia',
  'RS': 'Serbia',
  'BA': 'Bosnia and Herzegovina',
  'ME': 'Montenegro',
  'XK': 'Kosovo',
  'MD': 'Moldova',
  'UA': 'Ukraine',
  'BY': 'Belarus',
  'RU': 'Russia',
  'TR': 'Turkey',
  'IL': 'Israel',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'OM': 'Oman',
  'BH': 'Bahrain',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'SY': 'Syria',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'PK': 'Pakistan',
  'IN': 'India',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'AF': 'Afghanistan',
  'MM': 'Myanmar',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'LA': 'Laos',
  'KH': 'Cambodia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'BN': 'Brunei',
  'TL': 'East Timor',
  'CN': 'China',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'MO': 'Macau',
  'KR': 'South Korea',
  'KP': 'North Korea',
  'JP': 'Japan',
  'MN': 'Mongolia',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'FJ': 'Fiji',
  'PG': 'Papua New Guinea',
  'NC': 'New Caledonia',
  'WS': 'Samoa',
  'TO': 'Tonga',
  'VU': 'Vanuatu',
  'SB': 'Solomon Islands',
  'MX': 'Mexico',
  'GT': 'Guatemala',
  'BZ': 'Belize',
  'SV': 'El Salvador',
  'HN': 'Honduras',
  'NI': 'Nicaragua',
  'CR': 'Costa Rica',
  'PA': 'Panama',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'VE': 'Venezuela',
  'PE': 'Peru',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'GY': 'Guyana',
  'SR': 'Suriname',
  'GF': 'French Guiana',
  'EG': 'Egypt',
  'DZ': 'Algeria',
  'MA': 'Morocco',
  'TN': 'Tunisia',
  'LY': 'Libya',
  'SD': 'Sudan',
  'SS': 'South Sudan',
  'ET': 'Ethiopia',
  'SO': 'Somalia',
  'KE': 'Kenya',
  'UG': 'Uganda',
  'TZ': 'Tanzania',
  'RW': 'Rwanda',
  'BI': 'Burundi',
  'DJ': 'Djibouti',
  'ER': 'Eritrea',
  'MG': 'Madagascar',
  'MU': 'Mauritius',
  'KM': 'Comoros',
  'SC': 'Seychelles',
  'ZA': 'South Africa',
  'NA': 'Namibia',
  'BW': 'Botswana',
  'ZW': 'Zimbabwe',
  'ZM': 'Zambia',
  'MW': 'Malawi',
  'MZ': 'Mozambique',
  'AO': 'Angola',
  'CD': 'Democratic Republic of the Congo',
  'CG': 'Republic of the Congo',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CM': 'Cameroon',
  'GQ': 'Equatorial Guinea',
  'GA': 'Gabon',
  'ST': 'Sao Tome and Principe',
  'GH': 'Ghana',
  'NG': 'Nigeria',
  'BJ': 'Benin',
  'TG': 'Togo',
  'BF': 'Burkina Faso',
  'CI': 'Ivory Coast',
  'LR': 'Liberia',
  'SL': 'Sierra Leone',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GM': 'Gambia',
  'SN': 'Senegal',
  'MR': 'Mauritania',
  'ML': 'Mali',
  'NE': 'Niger',
  // Additional country names for countries missing continent assignment
  'AD': 'Andorra',
  'AM': 'Armenia',
  'AZ': 'Azerbaijan',
  'BS': 'Bahamas',
  'CU': 'Cuba',
  'CW': 'Curaçao',
  'DO': 'Dominican Republic',
  'FO': 'Faroe Islands',
  'GD': 'Grenada',
  'GE': 'Georgia',
  'HT': 'Haiti',
  'JM': 'Jamaica',
  'KZ': 'Kazakhstan',
  'LC': 'Saint Lucia',
  'LI': 'Liechtenstein',
  'PR': 'Puerto Rico',
  'RE': 'Réunion',
  'SM': 'San Marino',
  'TC': 'Turks and Caicos Islands',
  'TT': 'Trinidad and Tobago',
};

// Country to continent mapping
const COUNTRY_TO_CONTINENT: { [key: string]: string } = {
  'WW': 'Other',
  'Global': 'Global',
  'XX': 'Other',
  'Unknown': 'Other',
  'EU': 'Europe',
  'NA_REGION': 'North America',
  'SA_REGION': 'South America',
  'AF_REGION': 'Africa',
  'AS': 'Asia',
  'OC': 'Oceania',
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  'GT': 'North America',
  'BZ': 'North America',
  'SV': 'North America',
  'HN': 'North America',
  'NI': 'North America',
  'CR': 'North America',
  'PA': 'North America',
  'BR': 'South America',
  'AR': 'South America',
  'CL': 'South America',
  'CO': 'South America',
  'VE': 'South America',
  'PE': 'South America',
  'EC': 'South America',
  'BO': 'South America',
  'PY': 'South America',
  'UY': 'South America',
  'GY': 'South America',
  'SR': 'South America',
  'GF': 'South America',
  'GB': 'Europe',
  'DE': 'Europe',
  'FR': 'Europe',
  'ES': 'Europe',
  'IT': 'Europe',
  'NL': 'Europe',
  'BE': 'Europe',
  'CH': 'Europe',
  'AT': 'Europe',
  'PL': 'Europe',
  'CZ': 'Europe',
  'SE': 'Europe',
  'NO': 'Europe',
  'DK': 'Europe',
  'FI': 'Europe',
  'PT': 'Europe',
  'GR': 'Europe',
  'HU': 'Europe',
  'RO': 'Europe',
  'BG': 'Europe',
  'HR': 'Europe',
  'SI': 'Europe',
  'SK': 'Europe',
  'LT': 'Europe',
  'LV': 'Europe',
  'EE': 'Europe',
  'IE': 'Europe',
  'LU': 'Europe',
  'MT': 'Europe',
  'CY': 'Europe',
  'IS': 'Europe',
  'AL': 'Europe',
  'MK': 'Europe',
  'RS': 'Europe',
  'BA': 'Europe',
  'ME': 'Europe',
  'XK': 'Europe',
  'MD': 'Europe',
  'UA': 'Europe',
  'BY': 'Europe',
  'RU': 'Europe',
  'TR': 'Asia',
  'IL': 'Asia',
  'SA': 'Asia',
  'AE': 'Asia',
  'QA': 'Asia',
  'KW': 'Asia',
  'OM': 'Asia',
  'BH': 'Asia',
  'JO': 'Asia',
  'LB': 'Asia',
  'SY': 'Asia',
  'IQ': 'Asia',
  'IR': 'Asia',
  'PK': 'Asia',
  'IN': 'Asia',
  'BD': 'Asia',
  'LK': 'Asia',
  'NP': 'Asia',
  'AF': 'Asia',
  'MM': 'Asia',
  'TH': 'Asia',
  'VN': 'Asia',
  'LA': 'Asia',
  'KH': 'Asia',
  'MY': 'Asia',
  'SG': 'Asia',
  'ID': 'Asia',
  'PH': 'Asia',
  'BN': 'Asia',
  'TL': 'Asia',
  'CN': 'Asia',
  'TW': 'Asia',
  'HK': 'Asia',
  'MO': 'Asia',
  'KR': 'Asia',
  'KP': 'Asia',
  'JP': 'Asia',
  'MN': 'Asia',
  'AU': 'Oceania',
  'NZ': 'Oceania',
  'FJ': 'Oceania',
  'PG': 'Oceania',
  'NC': 'Oceania',
  'WS': 'Oceania',
  'TO': 'Oceania',
  'VU': 'Oceania',
  'SB': 'Oceania',
  'EG': 'Africa',
  'DZ': 'Africa',
  'MA': 'Africa',
  'TN': 'Africa',
  'LY': 'Africa',
  'SD': 'Africa',
  'SS': 'Africa',
  'ET': 'Africa',
  'SO': 'Africa',
  'KE': 'Africa',
  'UG': 'Africa',
  'TZ': 'Africa',
  'RW': 'Africa',
  'BI': 'Africa',
  'DJ': 'Africa',
  'ER': 'Africa',
  'MG': 'Africa',
  'MU': 'Africa',
  'KM': 'Africa',
  'SC': 'Africa',
  'ZA': 'Africa',
  'NA': 'Africa',
  'BW': 'Africa',
  'ZW': 'Africa',
  'ZM': 'Africa',
  'MW': 'Africa',
  'MZ': 'Africa',
  'AO': 'Africa',
  'CD': 'Africa',
  'CG': 'Africa',
  'CF': 'Africa',
  'TD': 'Africa',
  'CM': 'Africa',
  'GQ': 'Africa',
  'GA': 'Africa',
  'ST': 'Africa',
  'GH': 'Africa',
  'NG': 'Africa',
  'BJ': 'Africa',
  'TG': 'Africa',
  'BF': 'Africa',
  'CI': 'Africa',
  'LR': 'Africa',
  'SL': 'Africa',
  'GN': 'Africa',
  'GW': 'Africa',
  'GM': 'Africa',
  'SN': 'Africa',
  'MR': 'Africa',
  'ML': 'Africa',
  'NE': 'Africa',
  // Additional mappings for countries missing continent assignment
  'AD': 'Europe',     // Andorra
  'AM': 'Asia',       // Armenia
  'AZ': 'Asia',       // Azerbaijan
  'BS': 'North America', // Bahamas
  'CU': 'North America', // Cuba
  'CW': 'North America', // Curaçao
  'DO': 'North America', // Dominican Republic
  'FO': 'Europe',     // Faroe Islands
  'GD': 'North America', // Grenada
  'GE': 'Asia',       // Georgia
  'HT': 'North America', // Haiti
  'JM': 'North America', // Jamaica
  'KZ': 'Asia',       // Kazakhstan
  'LC': 'North America', // Saint Lucia
  'LI': 'Europe',     // Liechtenstein
  'PR': 'North America', // Puerto Rico
  'RE': 'Africa',     // Réunion (French territory)
  'SM': 'Europe',     // San Marino
  'TC': 'North America', // Turks and Caicos Islands
  'TT': 'North America', // Trinidad and Tobago
};

// Fetch JSON data from a URL using https
function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch JSON: ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseError: any) {
          reject(new Error(`Failed to parse JSON: ${parseError.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Update talkgroups from Brandmeister JSON API
export async function updateTalkgroups(): Promise<any> {
  console.log('Updating talkgroups from Brandmeister...');

  try {
    // Get count before update
    const beforeResult = await pool.query('SELECT COUNT(*) as count FROM talkgroups WHERE talkgroup_id != 9');
    const countBefore = parseInt(beforeResult.rows[0].count);

    // Fetch talkgroups data from Brandmeister JSON API
    const jsonUrl = 'https://api.brandmeister.network/v2/talkgroup';

    let talkgroupsData;
    try {
      talkgroupsData = await fetchJSON(jsonUrl);
    } catch (fetchError: any) {
      console.error('Failed to fetch talkgroups from JSON API:', fetchError.message);
      throw fetchError;
    }

    // Convert JSON object to array of records
    const records = [];
    for (const [talkgroupId, name] of Object.entries(talkgroupsData)) {
      // Skip invalid talkgroup IDs or names
      const id = parseInt(talkgroupId);
      if (!id || isNaN(id) || !name || typeof name !== 'string') {
        continue;
      }

      records.push({
        id: id,
        name: (name as string).trim(),
        talkgroup_id: id
      });
    }

    console.log(`Parsed ${records.length} talkgroups from JSON API`);

    // Track statistics
    let addedCount = 0;
    let updatedCount = 0;

    // Use PostgreSQL transaction for better performance
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const tg of records) {
        // Extract talkgroup data from JSON format
        const talkgroupId = tg.id;
        const name = tg.name || '';

        // Skip Local talkgroup (ID 9)
        if (talkgroupId === 9) {
          continue;
        }

        // Determine country from talkgroup ID
        let country = 'XX'; // Default to unknown

        // Apply simplified logic: Only talkgroups starting with 9 are Global
        const tgString = talkgroupId.toString();
        if (tgString.startsWith('9')) {
          // Global talkgroups - only those starting with 9
          country = 'Global';
        } else if (talkgroupId >= 46600 && talkgroupId <= 46699) {
          // Taiwan talkgroups (466xx)
          country = 'TW';
        } else if (talkgroupId >= 250000 && talkgroupId <= 250999) {
          // Russia talkgroups (250xx)
          country = 'RU';
        } else {
          // Country-specific talkgroups
          const tgString = talkgroupId.toString();
          if (tgString.length >= 3) {
            // Extract country code from first 3 digits for country-specific talkgroups
            const countryCode = tgString.substring(0, 3);

            // For longer talkgroup IDs, also check 2-digit and 4+ digit patterns
            let countryCode2 = '';
            let countryCode4 = '';
            if (tgString.length >= 2) {
              countryCode2 = tgString.substring(0, 2);
            }
            if (tgString.length >= 4) {
              countryCode4 = tgString.substring(0, 4);
            }

            // Comprehensive country code mapping based on ITU-T E.212 and DMR-MARC
            const countryMappings: { [key: string]: string } = {
              // European countries
              '202': 'GR', '204': 'NL', '206': 'BE', '208': 'FR', '213': 'AD',
              '214': 'ES', '216': 'HU', '218': 'BA', '219': 'HR', '220': 'RS',
              '222': 'IT', '226': 'RO', '228': 'CH', '230': 'CZ', '231': 'SK',
              '232': 'AT', '235': 'GB', '238': 'DK', '240': 'SE', '242': 'NO',
              '244': 'FI', '246': 'LT', '247': 'LV', '248': 'EE', '255': 'UA',
              '259': 'MD', '260': 'PL', '262': 'DE', '263': 'DE', '264': 'DE',
              '265': 'DE', '268': 'PT', '270': 'LU', '272': 'IE', '274': 'IS',
              '276': 'AL', '278': 'MT', '280': 'CY', '282': 'GE', '283': 'AM',
              '284': 'BG', '286': 'TR', '288': 'FO', '292': 'SM', '293': 'SI',
              '294': 'MK', '295': 'LI', '297': 'ME',

              // North American countries
              '302': 'CA', '310': 'US', '311': 'US', '312': 'US', '313': 'US',
              '314': 'US', '315': 'US', '316': 'US', '317': 'US', '318': 'US',
              '319': 'US', '330': 'PR', '334': 'MX', '338': 'JM', '352': 'GD',
              '358': 'LC', '362': 'CW', '364': 'BS', '368': 'CU', '370': 'DO',
              '372': 'HT', '374': 'TT', '376': 'TC',

              // Asian and Middle Eastern countries
              '400': 'AZ', '401': 'KZ', '404': 'IN', '410': 'PK', '415': 'LB',
              '420': 'SA', '422': 'OM', '425': 'IL', '426': 'BH', '427': 'QA',
              '430': 'AE', '440': 'JP', '450': 'KR', '452': 'VN', '454': 'HK',
              '460': 'CN', '470': 'BD', '502': 'MY', '505': 'AU', '510': 'ID',
              '515': 'PH', '520': 'TH', '525': 'SG', '530': 'NZ',

              // African countries
              '602': 'EG', '604': 'MA', '655': 'ZA',

              // South American countries
              '704': 'GT', '706': 'SV', '708': 'HN', '710': 'NI', '712': 'CR',
              '714': 'PA', '716': 'PE', '722': 'AR', '724': 'BR', '730': 'CL',
              '732': 'CO', '734': 'VE', '740': 'EC', '748': 'UY',

              // Special codes for specific regions (non-global)
              '899': 'XX',     // Repeater Testing - assign to unknown region
              '907': 'XX',     // JOTA - assign to unknown region
              '910': 'DE',     // German language
              '913': 'XX',     // English language - assign to unknown region
              '914': 'XX',     // Spanish language - assign to unknown region
              '915': 'XX',     // Portuguese language - assign to unknown region
              '916': 'XX',     // Italian language - assign to unknown region
              '918': 'XX',     // YOTA - assign to unknown region
              '920': 'DE',     // DL, OE, HB9
              '922': 'NL',     // Dutch language
              '923': 'XX',     // European English - assign to unknown region
              '924': 'SE',     // Swedish language
              '927': 'XX',     // Nordic - assign to unknown region
              '930': 'GR',     // PanHellenic Chat
              '937': 'FR',     // Francophonie
              '940': 'XX',     // Arabic language - assign to unknown region
              '955': 'XX',     // WWYL - assign to unknown region
              '969': 'XX',     // DMR-Caribbean - assign to unknown region
              '971': 'ES',     // Basque
              '973': 'XX',     // SOTA - assign to unknown region

              // 4+ digit patterns for regional/local talkgroups
              '2020': 'GR', '2040': 'NL', '2060': 'BE', '2080': 'FR', '2140': 'ES',
              '2160': 'HU', '2180': 'BA', '2190': 'HR', '2200': 'RS', '2220': 'IT',
              '2260': 'RO', '2280': 'CH', '2300': 'CZ', '2310': 'SK', '2320': 'AT',
              '2350': 'GB', '2380': 'DK', '2400': 'SE', '2410': 'SE', '2411': 'SE',
              '2412': 'SE', '2415': 'SE', '2420': 'NO', '2440': 'FI', '2460': 'LT',
              '2470': 'LV', '2480': 'EE', '2500': 'RU', '2501': 'RU', '2502': 'RU',
              '2503': 'RU', '2504': 'RU', '2505': 'RU', '2506': 'RU', '2507': 'RU',
              '2550': 'UA', '2555': 'UA', '2559': 'UA', '2570': 'BY', '2590': 'MD',
              '2599': 'MD', '2600': 'PL', '2620': 'DE', '2630': 'DE', '2640': 'DE',
              '2650': 'DE', '2680': 'PT', '2700': 'LU', '2720': 'IE', '2740': 'IS',
              '2780': 'MT', '2800': 'CY', '2820': 'GE', '2830': 'AM', '2840': 'BG',
              '2860': 'TR', '2880': 'FO', '2920': 'SM', '2930': 'SI', '2940': 'MK',
              '2950': 'LI', '2970': 'ME',

              // North America 4+ digit
              '3020': 'CA', '3100': 'US', '3300': 'PR', '3340': 'MX',

              // Asia 4+ digit
              '4000': 'AZ', '4010': 'KZ', '4040': 'IN', '4100': 'PK', '4150': 'LB',
              '4200': 'SA', '4220': 'OM', '4250': 'IL', '4260': 'BH', '4270': 'QA',
              '4300': 'AE', '4400': 'JP', '4415': 'JP', '4500': 'KR', '4520': 'VN',
              '4540': 'HK', '4600': 'CN', '4660': 'TW', '4700': 'BD', '5020': 'MY',
              '5050': 'AU', '5100': 'ID', '5150': 'PH', '5200': 'TH', '5250': 'SG',
              '5300': 'NZ',

              // Africa 4+ digit
              '6020': 'EG', '6040': 'MA', '6470': 'RE', '6471': 'RE', '6550': 'ZA',

              // South America 4+ digit
              '7040': 'GT', '7060': 'SV', '7080': 'HN', '7100': 'NI', '7120': 'CR',
              '7140': 'PA', '7160': 'PE', '7220': 'AR', '7240': 'BR', '7300': 'CL',
              '7320': 'CO', '7340': 'VE', '7400': 'EC', '7480': 'UY',

              // UK specific patterns
              '2348': 'GB', '2349': 'GB',

              // Russia 5+ digit patterns
              '25070': 'RU',
            };

            // Try 4-digit match first, then 3-digit, then 2-digit
            country = countryMappings[countryCode4] ||
                     countryMappings[countryCode] ||
                     countryMappings[countryCode2] ||
                     'XX';
          }
        }

        // Get full country name and continent
        const fullCountryName = COUNTRY_NAMES[country] || country;
        const continent = COUNTRY_TO_CONTINENT[country] ||
                         (country === 'Global' ? 'Global' : null);

        // Check if talkgroup exists before inserting
        const existsResult = await client.query(
          'SELECT talkgroup_id FROM talkgroups WHERE talkgroup_id = $1',
          [talkgroupId]
        );
        const exists = existsResult.rows.length > 0;

        await client.query(`
          INSERT INTO talkgroups (
            talkgroup_id, name, country, continent, full_country_name, last_updated
          ) VALUES ($1, $2, $3, $4, $5, EXTRACT(EPOCH FROM NOW()))
          ON CONFLICT (talkgroup_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            continent = EXCLUDED.continent,
            full_country_name = EXCLUDED.full_country_name,
            last_updated = EXTRACT(EPOCH FROM NOW())
        `, [talkgroupId, name, country, continent, fullCountryName]);

        // Track statistics
        if (exists) {
          updatedCount++;
        } else {
          addedCount++;
        }
      }

      // Get count after update
      const afterResult = await client.query('SELECT COUNT(*) as count FROM talkgroups WHERE talkgroup_id != 9');
      const countAfter = parseInt(afterResult.rows[0].count);

      await client.query('COMMIT');
      console.log('Talkgroups updated successfully');
      return {
        success: true,
        readFromSource: records.length,
        added: addedCount,
        updated: updatedCount,
        totalBefore: countBefore,
        totalAfter: countAfter
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error updating talkgroups:', error.message);
    return { success: false, error: error.message };
  }
}

// Get all talkgroups
export async function getAllTalkgroups() {
  try {
    const result = await pool.query('SELECT * FROM talkgroups WHERE talkgroup_id != 9 ORDER BY talkgroup_id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching talkgroups:', error);
    return [];
  }
}

// Get talkgroup by ID
export async function getTalkgroupById(talkgroupId: number) {
  try {
    const result = await pool.query('SELECT * FROM talkgroups WHERE talkgroup_id = $1', [talkgroupId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching talkgroup:', error);
    return null;
  }
}

// Get talkgroups by continent
export async function getTalkgroupsByContinent(continent: string) {
  try {
    const result = await pool.query('SELECT * FROM talkgroups WHERE continent = $1 AND talkgroup_id != 9 ORDER BY talkgroup_id', [continent]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching talkgroups by continent:', error);
    return [];
  }
}

// Get talkgroups by country
export async function getTalkgroupsByCountry(country: string) {
  try {
    const result = await pool.query('SELECT * FROM talkgroups WHERE country = $1 AND talkgroup_id != 9 ORDER BY talkgroup_id', [country]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching talkgroups by country:', error);
    return [];
  }
}

// Check if talkgroups table is empty (excluding Local talkgroup 9)
export async function isTalkgroupsTableEmpty(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM talkgroups WHERE talkgroup_id != 9');
    return parseInt(result.rows[0].count) === 0;
  } catch (error) {
    console.error('Error checking if talkgroups table is empty:', error);
    return true; // Default to empty if error
  }
}