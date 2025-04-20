import { Link, Modal, Text, VStack } from 'native-base';

import { useLinks } from '../../hooks/useLinks';

export const AboutModal = ({ showModal, onClose }) => {
  const { onLinkClick } = useLinks();

  return (
    <Modal isOpen={showModal} onClose={onClose} size='xl'>
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>About</Modal.Header>
        <Modal.Body pt='20px' pb='36px'>
          <VStack>
            <Text fontWeight='bold' fontSize='md'>
              MyDEV Version
            </Text>
            <Text color='gray.500'>
              {chrome?.runtime?.getManifest().version}
            </Text>
          </VStack>
          <VStack space='6px' mt='20px'>
            <Link
              fontSize='md'
              href='https://github.com/mydevwallet/mydev'
              _text={{
                fontSize: 'md',
                color: 'blue.500',
                fontWeight: 'semibold',
              }}
              onPress={() =>
                onLinkClick('https://github.com/mydevwallet/mydev')
              }
            >
              Visit source code
            </Link>
            <Link
              fontSize='md'
              href='https://x.com/MyDevWallet'
              _text={{
                fontSize: 'md',
                color: 'blue.500',
                fontWeight: 'semibold',
              }}
              onPress={() => onLinkClick('https://x.com/MyDevWallet')}
            >
              Contact us
            </Link>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
