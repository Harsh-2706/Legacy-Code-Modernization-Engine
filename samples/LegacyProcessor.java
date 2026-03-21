public class LegacyProcessor {
    public void processRecord(String record) {
        System.out.println("Processing record: " + record);
    }

    public void run() {
        String data = "Sample Data";
        processRecord(data);
    }

    public static void main(String[] args) {
        LegacyProcessor lp = new LegacyProcessor();
        lp.run();
    }
}
