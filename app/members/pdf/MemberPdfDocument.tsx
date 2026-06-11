import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

function clean(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function MemberPdfDocument({
  members,
}: {
  members: any[];
}) {
  const safeMembers = members || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Dunedin Meditation Hub</Text>
        <Text style={styles.subtitle}>Members List</Text>
        <Text style={styles.total}>
          Total Members: {String(safeMembers.length)}
        </Text>

        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.no}>No.</Text>
            <Text style={styles.name}>Name</Text>
            <Text style={styles.nickname}>Nickname</Text>
            <Text style={styles.phone}>Phone</Text>
            <Text style={styles.email}>Email</Text>
          </View>

          {safeMembers.map((member, index) => (
            <View key={clean(member.id) + String(index)} style={styles.row}>
              <Text style={styles.no}>{String(index + 1)}</Text>
              <Text style={styles.name}>{clean(member.full_name)}</Text>
              <Text style={styles.nickname}>{clean(member.nickname)}</Text>
              <Text style={styles.phone}>{clean(member.phone)}</Text>
              <Text style={styles.email}>{clean(member.email)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
  padding: 24,
  fontSize: 7,
  fontFamily: "Helvetica",
},
  title: {
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  total: {
    fontSize: 10,
    marginBottom: 14,
  },
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#cccccc",
  },
  row: {
  flexDirection: "row",
  borderBottomWidth: 1,
  borderColor: "#cccccc",
},
  header: {
    backgroundColor: "#eeeeee",
  },
  no: {
    width: "8%",
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  name: {
    width: "30%",
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  nickname: {
    width: "18%",
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  phone: {
    width: "18%",
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#cccccc",
  },
  email: {
    width: "26%",
    padding: 3,
  },
});