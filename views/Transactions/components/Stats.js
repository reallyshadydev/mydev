import { Divider, HStack, Image, Stack, Text } from 'native-base';

const DogecoinevIcon = 'assets/dogecoinev-icon.svg';
const ChartIcon = 'assets/chart.svg';

export function Stats({ usdPrice, devStats, ...props }) {
  return (
    <HStack justifyContent='space-between' px={6} {...props}>
      <HStack ai='center' space='12px'>
        <HStack p='8px' bg='yellow.50' borderRadius={7}>
          <Image src={DogecoinevIcon} width='24px' height='24px' alt='dogecoinev' />
        </HStack>
        <Stack>
          <Text fontSize={11}>Price (USD)</Text>
          <Text fontWeight='800'>${usdPrice?.toLocaleString()}</Text>
        </Stack>
      </HStack>
      <Divider orientation='vertical' />
      <HStack ai='center' space='12px'>
        <HStack p='8px' bg='yellow.50' borderRadius={7}>
          <Image src={ChartIcon} width='24px' height='24px' alt='chart' />
        </HStack>
        <HStack>
          <Text fontSize={11}>Txs (24hr)</Text>
          <Text fontWeight='800'>{devStats?.dailyTxs?.toLocaleString()}</Text>
        </HStack>
      </HStack>
    </HStack>
  );
}
