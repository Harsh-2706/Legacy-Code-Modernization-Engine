import javax.swing.*;
import java.awt.event.*;

/**
 * A classic Java Swing UI with massive boilerplate.
 * Used to demonstrate the Logic-Preserving Compression engine.
 */
public class LegacyUIApp extends JFrame {
    private JButton btn1, btn2, btn3, btn4, btn5;
    private JTextField txt1;

    public LegacyUIApp() {
        setTitle("Legacy Inventory System v1.1 (2004)");
        setSize(400, 300);
        setLayout(new java.awt.FlowLayout());

        // This block is "noise" that the compressor will collapse
        btn1 = new JButton("Add Record");
        btn1.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 12));
        btn1.setBackground(java.awt.Color.LIGHT_GRAY);
        btn1.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println("Processing ADD...");
            }
        });

        btn2 = new JButton("Edit Record");
        btn2.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 12));
        btn2.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println("Processing EDIT...");
            }
        });

        btn3 = new JButton("Delete Record");
        btn3.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 12));
        btn3.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println("Processing DELETE...");
            }
        });

        add(btn1); add(btn2); add(btn3);
        
        System.out.println("System Log: Inventory UI Initialized @ " + new java.util.Date());
    }

    public void processLogic() {
        // Business logic hidden in the noise
        int inventoryCount = 100;
        if (inventoryCount > 50) {
            System.out.println("Sufficient stock.");
        }
    }

    public static void main(String[] args) {
        new LegacyUIApp().setVisible(true);
    }
}
