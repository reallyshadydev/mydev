import { Box, HStack, Image, Text, VStack } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from '../../components/Button';
import { Footer } from '../../components/Footer';
import { useAppContext } from '../../hooks/useAppContext';
import { OnboardingLayout } from './OnboardingLayout';

export const Intro = () => {
  const { navigate } = useAppContext();
  const onCreateWallet = useCallback(() => {
    navigate('CreateWallet');
  }, [navigate]);

  const onImportWallet = useCallback(() => {
    navigate('ImportWallet');
  }, [navigate]);

  return (
    <OnboardingLayout>
      <VStack px='15%' justifyContent='center' h='100%'>
        <HStack bg='white' py='40px' rounded='sm' px='40px' alignItems='center'>
          <Box
            p='18px'
            rounded='3xl'
            style={{
              boxShadow: '0px 8px 28px 0px rgba(52, 52, 52, 0.08)',
            }}
            mr='20px'
          >
            <Image
              source={{ uri: '/assets/wallet-create.png' }}
              size='48px'
              resizeMode='contain'
              alt='create-wallet'
            />
          </Box>
          <VStack alignItems='center' flex={1}>
            <Text color='gray.600' fontWeight='medium' textAlign='center'>
              Create a new wallet
            </Text>
            <BigButton mt='20px' onPress={onCreateWallet}>
              Create Wallet
            </BigButton>
          </VStack>
        </HStack>
        <HStack
          bg='white'
          py='40px'
          rounded='sm'
          px='40px'
          mt='42px'
          alignItems='center'
        >
          <Box
            p='18px'
            rounded='3xl'
            style={{
              boxShadow: '0px 8px 28px 0px rgba(52, 52, 52, 0.08)',
            }}
            mr='20px'
          >
            <Image
              source={{ uri: '/assets/wallet-import.png' }}
              size='48px'
              resizeMode='contain'
              alt='import wallet'
            />
          </Box>
          <VStack alignItems='center' flex={1}>
            <Text color='gray.600' fontWeight='medium' textAlign='center'>
              Already have a wallet? Restore
            </Text>
            <BigButton variant='secondary' mt='20px' onPress={onImportWallet}>
              Import Wallet
            </BigButton>
          </VStack>
        </HStack>
        <Footer />
      </VStack>
    </OnboardingLayout>
  );
};
