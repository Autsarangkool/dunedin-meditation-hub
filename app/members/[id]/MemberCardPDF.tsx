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
    width: 242.65,
    height: 153.01,
    padding: 6,
    backgroundColor: "#ffffff",
  },
  card: {
    height: "100%",
    border: "1.5 solid #4b5f4a",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#fffdf8",
  },
  header: {
    backgroundColor: "#4b5f4a",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 6,
    textAlign: "center",
    marginTop: 1,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrBox: {
    width: 75,
    alignItems: "center",
  },
  qr: {
    width: 68,
    height: 68,
  },
  qrText: {
    fontSize: 5.5,
    color: "#666666",
    marginTop: 3,
  },
  info: {
    flex: 1,
    paddingLeft: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 4,
  },
  role: {
    fontSize: 8,
    color: "#4b5f4a",
    marginBottom: 4,
  },
  footer: {
    fontSize: 7,
    color: "#111111",
  },
});

export default function MemberCardPDF({
  name,
  qrUrl,
}: {
  name: string;
  photoUrl?: string;
  qrUrl: string;
}) {
  return (
    <Document>
      <Page size={{ width: 242.65, height: 153.01 }} style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>DUNEDIN MEDITATION HUB</Text>
            <Text style={styles.subtitle}>Member Card</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.qrBox}>
              <Image src={qrUrl} style={styles.qr} />
              <Text style={styles.qrText}>Scan for Check-In</Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.role}>Active Member</Text>
              <Text style={styles.footer}>Dunedin Meditation Hub</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}