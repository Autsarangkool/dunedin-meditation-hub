"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 20,
  },

  card: {
    border: "1 solid #000",
    padding: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    marginBottom: 10,
  },

  photo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },

  name: {
    fontSize: 14,
    marginBottom: 10,
  },

  qr: {
    width: 120,
    height: 120,
  },
});

export default function MemberCardPDF({
  name,
  photoUrl,
  qrUrl,
}: {
  name: string;
  photoUrl?: string;
  qrUrl: string;
}) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>
            Dunedin Meditation Hub
          </Text>

          {photoUrl ? (
            <Image src={photoUrl} style={styles.photo} />
          ) : null}

          <Text style={styles.name}>{name}</Text>

          <Image src={qrUrl} style={styles.qr} />

          <Text>Scan for Check-In</Text>
        </View>
      </Page>
    </Document>
  );
}