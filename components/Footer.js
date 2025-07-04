import { Text } from 'native-base';

import { useLinks } from '../hooks/useLinks';

export const Footer = ({ ...props }) => {
  const { onLinkClick } = useLinks();

  return (
    <Text textAlign='center' mt='80px' color='gray.400' {...props}>
      Need help using MyDEV?{'\n'}
      <Text
        color='brandYellow.500'
        underline
        fontWeight='medium'
        onClickFAQ
        onPress={() => onLinkClick('https://x.com/MyDevWallet')}
      >
        Frequently Asked Questions
      </Text>
    </Text>
  );
};
