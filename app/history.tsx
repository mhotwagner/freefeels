import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { deleteEntry, Entry, listEntries } from '@/lib/db';
import { formatEntryTimestamp } from '@/lib/time';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    const next = await listEntries();
    setEntries(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries]),
  );

  const onDelete = (entry: Entry) => {
    Alert.alert('Delete check-in?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteEntry(entry.id).then(() => {
            if (expandedId === entry.id) {
              setExpandedId(null);
            }
            void loadEntries();
          });
        },
      },
    ]);
  };

  if (!entries.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No check-ins yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const expanded = expandedId === item.id;
        return (
          <Pressable
            onPress={() => setExpandedId(expanded ? null : item.id)}
            style={styles.card}
            accessibilityRole="button"
          >
            <Text numberOfLines={expanded ? undefined : 2} style={styles.entryText}>
              {item.text}
            </Text>
            <Text style={styles.timestamp}>{formatEntryTimestamp(item.createdAt)}</Text>
            {expanded ? (
              <Pressable
                onPress={() => onDelete(item)}
                style={styles.deleteButton}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 14,
    gap: 8,
  },
  entryText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  timestamp: {
    color: '#6b7280',
    fontSize: 13,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
