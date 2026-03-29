// ExitModal.tsx — 종료 확인 모달
// "누수체크를 종료할까요?" + 취소/종료하기 버튼

import React from 'react';
import ConfirmDialog from '@toss/tds-react-native/dist/esm/components/dialog/ConfirmDialog';
import { Button } from '@toss/tds-react-native';
import { COLORS } from '../constants/config';

interface ExitModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ExitModal({ visible, onCancel, onConfirm }: ExitModalProps) {
  return (
    <ConfirmDialog
      open={visible}
      onClose={onCancel}
      title="누수체크를 종료할까요?"
      leftButton={
        <ConfirmDialog.Button type="light" onPress={onCancel}>
          취소
        </ConfirmDialog.Button>
      }
      rightButton={
        <ConfirmDialog.Button type="primary" onPress={onConfirm}>
          종료하기
        </ConfirmDialog.Button>
      }
    />
  );
}
