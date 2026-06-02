import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { insertEntry } from '@/lib/db';

export default function CheckInScreen() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const trimmed = useMemo(() => text.trim(), [text]);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timeout = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [saved]);

  const onSave = async () => {
    if (!trimmed) {
      return;
    }

    await insertEntry(trimmed);
    setText('');
    setSaved(true);
    Keyboard.dismiss();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'How Are You Feeling?' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <Text style={styles.prompt}>How are you feeling?</Text>
        <TextInput
          autoFocus
          multiline
          placeholder="Write whatever is on your mind..."
          style={styles.input}
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
          returnKeyType="default"
        />
        <Pressable
          style={[styles.button, !trimmed && styles.buttonDisabled]}
          disabled={!trimmed}
          onPress={() => {
            void onSave();
          }}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
        {saved ? <Text style={styles.saved}>Saved</Text> : null}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    gap: 12,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    minHeight: 240,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saved: {
    color: '#166534',
    minHeight: 20,
  },
});
