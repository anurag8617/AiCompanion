import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import axios from 'axios';
import { ThemeColors } from '../theme/colors';

interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

interface ContactsScreenProps {
  user: {
    id: number;
    username: string;
  };
  theme: ThemeColors;
  baseUrl: string;
  onBack: () => void;
}

export const ContactsScreen = ({ user, theme, baseUrl, onBack }: ContactsScreenProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'csv' | 'manual'>('list');

  // Manual contact states
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/contacts/${user.id}`);
      if (response.data.status === 'success') {
        setContacts(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCsvUpload = async () => {
    if (!csvText.trim()) {
      Alert.alert('Error', 'Please enter CSV data first.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/contacts/csv`, {
        userId: user.id,
        csvText: csvText,
      });

      if (response.data.status === 'success') {
        Alert.alert('Success', response.data.message || 'Contacts imported successfully.');
        setCsvText('');
        setViewMode('list');
        fetchContacts();
      }
    } catch (error) {
      console.log('CSV Upload error:', error);
      Alert.alert('Error', 'Failed to upload CSV data.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualName.trim()) {
      Alert.alert('Error', 'Contact Name is required.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/contacts`, {
        userId: user.id,
        name: manualName,
        phone: manualPhone,
        email: manualEmail,
      });

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Contact saved successfully!');
        setManualName('');
        setManualPhone('');
        setManualEmail('');
        setViewMode('list');
        fetchContacts();
      }
    } catch (error) {
      console.log('Manual Add error:', error);
      Alert.alert('Error', 'Failed to save contact.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={[styles.contactCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>{item.phone || 'No phone'}</Text>
        <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>{item.email || 'No email'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contacts</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'manual' ? 'list' : 'manual')} 
            style={[styles.uploadButton, { backgroundColor: theme.primary, marginRight: 8 }]}
          >
            <Text style={styles.uploadButtonText}>{viewMode === 'manual' ? 'Cancel' : 'Add'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'csv' ? 'list' : 'csv')} 
            style={[styles.uploadButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.uploadButtonText}>{viewMode === 'csv' ? 'Cancel' : 'CSV'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'csv' ? (
        <ScrollView contentContainerStyle={styles.uploaderContainer}>
          <Text style={[styles.uploaderTitle, { color: theme.text }]}>Batch Upload Contacts</Text>
          <Text style={[styles.uploaderDesc, { color: theme.textSecondary }]}>
            Enter contacts in CSV format (one per line):{"\n"}
            Name, Phone, Email
          </Text>
          <TextInput
            style={[styles.csvInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            multiline
            placeholder="John Doe, +1234567890, john@example.com"
            placeholderTextColor={theme.textSecondary}
            value={csvText}
            onChangeText={setCsvText}
          />
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleCsvUpload}
            disabled={isUploading}
          >
            {isUploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Upload Contacts</Text>}
          </TouchableOpacity>
          <View style={styles.formatHelp}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Format Help:</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>- Each line is a contact.</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>- Columns: Name, Phone, Email (separated by commas).</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>- You can leave phone or email blank if unknown.</Text>
          </View>
        </ScrollView>
      ) : viewMode === 'manual' ? (
        <ScrollView contentContainerStyle={styles.uploaderContainer}>
          <Text style={[styles.uploaderTitle, { color: theme.text }]}>Add New Contact</Text>
          <Text style={[styles.uploaderDesc, { color: theme.textSecondary }]}>
            Manually enter the details of the person you want to save.
          </Text>
          
          <TextInput
            style={[styles.manualInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Name (Required)"
            placeholderTextColor={theme.textSecondary}
            value={manualName}
            onChangeText={setManualName}
          />
          <TextInput
            style={[styles.manualInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Phone Number (Optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={manualPhone}
            onChangeText={setManualPhone}
          />
          <TextInput
            style={[styles.manualInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Email Address (Optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={manualEmail}
            onChangeText={setManualEmail}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, marginTop: 12 }]}
            onPress={handleManualAdd}
            disabled={isUploading}
          >
            {isUploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Save Contact</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No contacts saved yet.</Text>
              <TouchableOpacity onPress={() => setViewMode('manual')}>
                <Text style={{ color: theme.primary, marginTop: 12, fontWeight: '700' }}>Add a Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('csv')}>
                <Text style={{ color: theme.primary, marginTop: 12, fontWeight: '700' }}>Import from CSV</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderContact}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  contactCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploaderContainer: {
    padding: 24,
  },
  uploaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  uploaderDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  csvInput: {
    height: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  manualInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  formatHelp: {
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
